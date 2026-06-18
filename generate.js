export default async function handler(req, res) {
  // Allow requests from your app
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST")    { res.status(405).json({ error: "Method not allowed" }); return; }

  const { topic, format, tone, count } = req.body;

  if (!topic || !format || !tone || !count) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "API key not configured" }); return;
  }

  const prompt = `You are a viral TikTok content strategist. Generate exactly ${count} unique TikTok reel templates for the topic: "${topic}".
Format: ${format}
Tone: ${tone}
Rules:
- Each template must be ready to use, punchy, and optimized for TikTok
- Include hook, body, and CTA
- Add 5-7 relevant hashtags
- Make them feel authentic, not corporate
Respond ONLY with a valid JSON array, no markdown, no explanation:
[{"id":"1","title":"Short catchy name","hook":"Opening line","body":"Main content (2-4 sentences)","cta":"Call to action","hashtags":"#tag1 #tag2 #tag3","tip":"One quick filming tip"}]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":         "application/json",
        "x-api-key":            apiKey,
        "anthropic-version":    "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 1000,
        messages:   [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      res.status(500).json({ error: data.error.message }); return;
    }

    const raw    = data.content?.map(b => b.text || "").join("") || "[]";
    const clean  = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.status(200).json({ templates: parsed });

  } catch (err) {
    res.status(500).json({ error: "Failed to generate templates: " + err.message });
  }
}
