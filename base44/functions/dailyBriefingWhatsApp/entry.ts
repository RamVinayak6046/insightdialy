import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// 7 AM IST daily: ingest news -> build briefing -> build 5 sections -> send via WhatsApp.
// Template params (in this order): education_careers, ai_technology, india, global, jobs_opportunities
const SECTIONS = [
  { key: 'education_careers', label: 'Education & Careers', pick: (a) => a.category === 'education' },
  { key: 'ai_technology', label: 'AI & Technology', pick: (a) => a.category === 'tech' },
  { key: 'india', label: 'India', pick: (a) => a.region === 'india' },
  { key: 'global', label: 'Global', pick: (a) => a.region === 'global' },
  { key: 'jobs_opportunities', label: 'Jobs & Opportunities', pick: (a) => a.category === 'jobs' },
];

// Verified from this WABA's approved template metadata: English, named body parameters.
const TEMPLATE_NAME = 'daily_news_hub';
const TEMPLATE_LANGUAGE = 'en';
const sanitize = (s, n = 1000) => String(s || '').slice(0, n);

export default async function (req) {
  const log = [];
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ ok: false, sent: false, error: 'Forbidden' }, { status: 403 });
    const db = base44.asServiceRole.entities;
    const today = new Date().toISOString().slice(0, 10);

    // 1. Fetch the latest news using the existing ingestion system.
    let fetched = 0;
    try {
      const r = await base44.asServiceRole.functions.invoke('refreshNewsFeeds', {});
      fetched = r?.added ?? r?.data?.added ?? 0;
      log.push(`ingested=${fetched}`);
    } catch (e) {
      log.push(`ingest_error=${sanitize(e.message, 120)}`);
    }

    // 2. Load today's stories (already deduped + summarized by refreshNewsFeeds).
    const { items } = await db.Article.filter({ fetched_date: today }, { sort: '-relevance', limit: 40, fields: ['title', 'summary', 'category', 'region', 'importance', 'source'] });
    log.push(`today_items=${items.length}`);
    if (!items.length) {
      return Response.json({ ok: false, today, fetched, sent: false, reason: 'No stories available today', log });
    }

    // 3. Generate the day's briefing using the existing summarization function; persist it.
    try {
      const brief = await base44.asServiceRole.functions.invoke('summarizeBriefing', { items });
      const headline = brief?.headline ?? brief?.data?.headline ?? '';
      const points = brief?.points ?? brief?.data?.points ?? [];
      const existing = (await db.Briefing.filter({ date: today }, { limit: 1 })).items[0];
      const data = { date: today, headline: sanitize(headline, 300), points: (points || []).map((p) => sanitize(p, 280)) };
      if (existing) await db.Briefing.update(existing.id, data);
      else await db.Briefing.create(data);
      log.push('briefing_saved');
    } catch (e) {
      log.push(`briefing_error=${sanitize(e.message, 120)}`);
    }

    // 4. Build the 5 mapped section summaries (one LLM call, factual, from today's stories only).
    const sectionInputs = SECTIONS.map((s) => ({
      key: s.key,
      label: s.label,
      stories: items.filter(s.pick).slice(0, 8).map((a) => ({ title: a.title, summary: a.summary, source: a.source })),
    }));
    let sections = {};
    try {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:
          `You are a morning news editor for a reader in India. Using ONLY the stories provided under each section, write a concise factual summary for that section (2-3 sentences, under 900 characters). ` +
          `Do not invent facts or stories. If a section has no stories, output exactly "No major updates today." Return a JSON object with keys: ${SECTIONS.map((s) => s.key).join(', ')}.\n` +
          JSON.stringify(sectionInputs),
        response_json_schema: {
          type: 'object',
          properties: Object.fromEntries(SECTIONS.map((s) => [s.key, { type: 'string' }])),
        },
      });
      sections = result || {};
    } catch (e) {
      log.push(`sections_error=${sanitize(e.message, 120)}`);
      sections = {};
    }
    const params = SECTIONS.map((s) => sanitize(sections[s.key] || 'No major updates today.', 1000));

    // 5. Resolve WhatsApp secrets (names only; values never logged).
    const token = secrets.get('WHATSAPP_ACCESS_TOKEN');
    const phoneId = secrets.get('WHATSAPP_PHONE_NUMBER_ID');
    const to = String(secrets.get('WHATSAPP_RECIPIENT_PHONE') || '').replace(/\D/g, ''); // WhatsApp 'to' must be digits only, no '+'
    const missing = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_RECIPIENT_PHONE'].filter((n) => !secrets.get(n));
    if (missing.length) {
      return Response.json({ ok: false, today, fetched, sent: false, reason: 'Missing WhatsApp secrets', missing, log });
    }

    // 6. One send using the exact approved language and named parameter structure.
    const sendParams = SECTIONS.map((section, index) => ({
      type: 'text',
      parameter_name: section.key,
      text: params[index].replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, ' ').trim(),
    }));
    const waRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: TEMPLATE_NAME,
          language: { code: TEMPLATE_LANGUAGE },
          components: [{ type: 'body', parameters: sendParams }],
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const waJson = await waRes.json();

    // 7. Report accurately; never surface the access token.
    if (!waRes.ok) {
      const code = waJson?.error?.code;
      const msg = sanitize(waJson?.error?.message || '', 200);
      const templateIssue = /template|not approved|not active|status|review|rejection|translation/i.test(msg) || [132000, 132001, 132015, 132016, 132017].includes(code);
      return Response.json({
        ok: false,
        today,
        fetched,
        sent: false,
        template_status_issue: templateIssue,
        whatsapp_error: { code, message: msg, details: sanitize(waJson?.error?.error_data?.details || '', 300) },
        template: TEMPLATE_NAME,
        language: TEMPLATE_LANGUAGE,
        log,
      });
    }

    return Response.json({ ok: true, today, fetched, sent: true, accepted: true, delivery_confirmed: false, message_id: waJson?.messages?.[0]?.id, message_status: waJson?.messages?.[0]?.message_status || 'accepted', template: TEMPLATE_NAME, language: TEMPLATE_LANGUAGE, parameter_names: SECTIONS.map((s) => s.key), log });
  } catch (error) {
    return Response.json({ ok: false, sent: false, error: sanitize(error.message, 200), log });
  }
}