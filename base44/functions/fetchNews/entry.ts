import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const TOPICS = {
  education: "education, exams, admissions, scholarships and universities",
  jobs: "careers, hiring, job market, layoffs and skills/upskilling",
  tech: "technology and artificial intelligence",
  business: "business, markets and the economy",
  government: "government policy, schemes and regulation",
  sports: "sports (cricket first, then other major sports)",
  weather: "weather forecasts, monsoon and cyclone updates",
  alerts: "important public alerts: safety, disasters, health advisories, major breaking events",
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const category = String(body.category || "");
    if (!TOPICS[category]) return Response.json({ error: "Invalid category" }, { status: 400 });
    const today = new Date().toISOString().slice(0, 10);
    const domains = (Array.isArray(body.domains) ? body.domains : [])
      .map((d) => String(d).trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 10);
    const domainHint = domains.length ? ` Prefer stories from these publishers: ${domains.join(", ")}.` : "";
    const prompt = `Today is ${today}. Find 6 of the most recent, real news stories (last 48 hours) about ${TOPICS[category]}. ` +
      `Mix India-focused stories (about 4) and global stories (about 2). For each give: title, a neutral 2 sentence summary, ` +
      `the real article URL from the publisher, the publisher name as source, published_at as ISO 8601 date-time, ` +
      `region ("india" or "global"), importance ("low","medium","high" or "critical"), image_url (the article's main image URL if known, else empty), and is_alert (true only if urgent/important). Only include stories with a real working URL.${domainHint}`;
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: "gemini_3_8_flash",
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          articles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                summary: { type: "string" },
                url: { type: "string" },
                source: { type: "string" },
                published_at: { type: "string" },
                region: { type: "string" },
                is_alert: { type: "boolean" },
                importance: { type: "string" },
                image_url: { type: "string" },
              },
            },
          },
        },
      },
    });
    const articles = (result.articles || [])
      .filter((a) => a.title && a.url && /^https?:\/\//.test(a.url))
      .slice(0, 8);
    return Response.json({ articles });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}