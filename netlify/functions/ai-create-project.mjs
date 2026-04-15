// netlify/functions/ai-create-project.mjs
// Netlify Serverless Function — calls Anthropic API to generate a project plan
// Env vars needed in Netlify Dashboard → Site settings → Environment variables:
//   ANTHROPIC_API_KEY

export default async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const { description } = body || {};
  if (!description?.trim()) {
    return new Response(JSON.stringify({ error: "description is required" }), { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `You are a project planning assistant. Given a project description, return a JSON object (no markdown, no code fences) with this exact shape:
{
  "pillar": { "name": "...", "description": "...", "icon": "...", "color": "#xxxxxx" },
  "milestones": [
    { "name": "...", "status": "not_started", "due_date": "YYYY-MM-DD", "notes": "...", "urgent": true|false, "important": true|false, "recurrence_rule": null|"daily"|"weekly"|"monthly"|"quarterly" }
  ]
}
Rules:
- icon must be a single emoji
- color must be a hex colour (pick something vibrant that matches the project theme)
- Produce 6-12 milestones covering the full project lifecycle in logical order
- Assign realistic due_date values relative to today (${today})
- Set urgent/important flags using the Eisenhower matrix:
    urgent=true means this needs action within the next 1-2 weeks
    important=true means this has high impact on project success
- recurrence_rule is null unless the milestone is genuinely recurring (e.g. weekly standup, monthly review)
- Return ONLY the JSON object, nothing else.`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: description.trim() }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("[ai-create-project] Anthropic error:", errText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${anthropicRes.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await anthropicRes.json();
    const rawText = data.content?.[0]?.text || "";

    // Strip accidental markdown fences
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[ai-create-project] Failed to parse JSON:", cleaned.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "AI returned invalid JSON. Please try again." }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[ai-create-project] Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/ai-create-project" };
