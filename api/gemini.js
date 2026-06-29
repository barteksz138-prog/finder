export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { provider, model, apiKey, messages, prompt, generationConfig } = req.body;
  if (!apiKey) return res.status(400).json({ error: "Brak apiKey" });

  try {
    if (provider === "groq") {
      // Groq — OpenAI-compatible endpoint
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: generationConfig?.temperature ?? 0.7,
          max_tokens: generationConfig?.maxOutputTokens ?? 2048,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) return res.status(resp.status).json(data);
      res.json(data);

    } else {
      // Gemini
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = { generationConfig: generationConfig || {} };
      if (messages) {
        body.contents = messages;
      } else if (prompt) {
        body.contents = [{ parts: [{ text: prompt }] }];
      } else {
        return res.status(400).json({ error: "Brak messages lub prompt" });
      }
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) return res.status(resp.status).json(data);
      res.json(data);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
