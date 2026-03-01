import { getConciergeDigest } from "../analytics/analyticsEngine";

export async function aiConciergeSuggest(
  message: string,
  role: "user" | "delivery_boy"
) {
  const digest = getConciergeDigest();
  const prompt = `You are WHISTLE campus concierge. Use ONLY this digest: ${JSON.stringify(
    digest
  )}.
Role: ${role}. Last message: ${message}. Return 3 short replies, comma-separated, WhatsApp tone, max 10 words, one emoji max.`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  const data = await resp.json();
  const text = data.candidates?.[0].content.parts?.[0].text || "";
  return text
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
}
