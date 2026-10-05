import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const items = (Array.isArray(body.items) ? body.items : []).slice(0, 24).map((i) => ({
      title: String(i.title || "").slice(0, 200),
      category: String(i.category || "").slice(0, 20),
      summary: String(i.summary || "").slice(0, 300),
    }));
    if (!items.length) return Response.json({ error: "No items" }, { status: 400 });
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a morning news editor for a reader in India who cares about education, careers, tech/AI, business, government, sports, weather and alerts. ` +
        `From these stories write a briefing: one headline sentence and 5 concise bullet points (each under 28 words), most important first, alerts first if any.\n` +
        JSON.stringify(items),
      response_json_schema: {
        type: "object",
        properties: { headline: { type: "string" }, points: { type: "array", items: { type: "string" } } },
      },
    });
    return Response.json({ headline: result.headline, points: result.points || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}