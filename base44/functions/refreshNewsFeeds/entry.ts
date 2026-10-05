import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { DEFAULT_FEEDS } from './feeds.ts';
import { parseFeed, normTitle, normUrl } from './parse.ts';

const CATS = ["education", "jobs", "tech", "business", "government", "sports", "weather", "alerts"];
const IMPORTANCE = ["low", "medium", "high", "critical"];
const PRIORITY = { education: 0, jobs: 0, tech: 0, alerts: 1, government: 2, business: 2, sports: 3, weather: 3 };
const MAX_AGE_MS = 3 * 24 * 3600 * 1000;
const MAX_NEW = 48;

async function loadFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; InsightDailyBot/1.0)", Accept: "application/rss+xml, application/xml, text/xml, */*" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return parseFeed(await res.text()).map((i) => ({ ...i, source: feed.name, category: feed.category, region: feed.region }));
  } catch (_e) {
    return [];
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    // Feeds: defaults + enabled RSS sources the user added in Settings
    const custom = (await db.NewsSource.filter({ enabled: true, type: "rss" }, { limit: 50 })).items || [];
    const feeds = [...DEFAULT_FEEDS];
    for (const s of custom) {
      if (!/^https?:\/\//.test(s.endpoint_url || "")) continue;
      const cats = s.categories?.length ? s.categories : ["tech"];
      cats.forEach((c) => feeds.push({ name: s.name, url: s.endpoint_url, category: c, region: "india" }));
    }

    const loaded = (await Promise.all(feeds.map(loadFeed))).flat();
    const cutoff = Date.now() - MAX_AGE_MS;
    const seenUrl = new Set();
    const seenTitle = new Set();
    let candidates = [];
    for (const i of loaded) {
      if (!i.title || !/^https?:\/\//.test(i.url)) continue;
      if (i.published_at && Date.parse(i.published_at) < cutoff) continue;
      const u = normUrl(i.url);
      const t = normTitle(i.title);
      if (seenUrl.has(u) || seenTitle.has(t)) continue;
      seenUrl.add(u);
      seenTitle.add(t);
      candidates.push({ ...i, url: u });
    }

    // Skip stories already stored (by URL or title)
    const recent = (await db.Article.filter({}, { sort: "-created_date", limit: 500, fields: ["url", "title"] })).items || [];
    const knownUrl = new Set(recent.map((a) => normUrl(a.url)));
    const knownTitle = new Set(recent.map((a) => normTitle(a.title || "")));
    candidates = candidates.filter((c) => !knownUrl.has(c.url) && !knownTitle.has(normTitle(c.title)));
    candidates.sort((a, b) => PRIORITY[a.category] - PRIORITY[b.category] || Date.parse(b.published_at || now) - Date.parse(a.published_at || now));
    const perCat = {};
    candidates = candidates.filter((c) => (perCat[c.category] = (perCat[c.category] || 0) + 1) <= 7).slice(0, MAX_NEW);
    if (!candidates.length) return Response.json({ added: 0, fetched: loaded.length });

    // AI summaries, classification and ranking in one call
    let ai = [];
    try {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:
          `You are the editor of a news dashboard for a reader in India who most cares about education & careers, jobs & skills, and technology & AI. ` +
          `For each story below (given by index) return: summary (2-4 concise, neutral sentences based ONLY on the given title/description, no invented facts), ` +
          `category (one of ${CATS.join(", ")}; use "alerts" only for urgent public safety, disaster, health or major breaking events), ` +
          `importance (low, medium, high or critical), relevance (0-100; give education/careers, jobs/skills and tech/AI stories the highest scores, then alerts, government and business, then sports), ` +
          `region (india or global), is_alert (true only if urgent).\n` +
          JSON.stringify(candidates.map((c, index) => ({ index, title: c.title, description: c.description, source: c.source, hint: c.category }))),
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "number" },
                  summary: { type: "string" },
                  category: { type: "string" },
                  importance: { type: "string" },
                  relevance: { type: "number" },
                  region: { type: "string" },
                  is_alert: { type: "boolean" },
                },
              },
            },
          },
        },
      });
      ai = result.items || [];
    } catch (_e) {
      ai = [];
    }
    const byIndex = new Map(ai.map((a) => [Number(a.index), a]));

    const records = candidates.map((c, idx) => {
      const a = byIndex.get(idx) || {};
      const category = CATS.includes(a.category) ? a.category : c.category;
      return {
        title: c.title,
        summary: (a.summary || c.description || "").slice(0, 700),
        url: c.url,
        source: c.source,
        category,
        region: a.region === "global" || a.region === "india" ? a.region : c.region,
        published_at: c.published_at || now,
        fetched_date: today,
        fetched_at: now,
        image_url: c.image_url || undefined,
        importance: IMPORTANCE.includes(a.importance) ? a.importance : category === "alerts" ? "high" : "medium",
        relevance: Math.max(0, Math.min(100, Number(a.relevance) || 40)),
        is_alert: !!a.is_alert,
      };
    });

    await db.Article.upsert(records, { key: "url" });
    return Response.json({ added: records.length, fetched: loaded.length, ai: ai.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}