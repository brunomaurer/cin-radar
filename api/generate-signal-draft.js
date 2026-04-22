import { anthropic, readBody, fail, envCheck } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'POST only');
  const missing = envCheck();
  if (missing.includes('ANTHROPIC_API_KEY')) return fail(res, 500, 'API key missing');

  try {
    const { prompt } = await readBody(req);
    if (!prompt) return fail(res, 400, 'prompt required');

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: `Du bist ein Innovation-Analyst. Aus der folgenden Eingabe, erstelle ein strukturiertes Signal.

Eingabe: ${prompt}

Antworte NUR als JSON:
{
  "title": "Prägnanter Titel (wie eine Headline)",
  "source": "Quellenname falls erkennbar, sonst leer",
  "type": "Product|Research|Policy|Funding|Corp|Adoption|Market",
  "summary": "2-3 Sätze Zusammenfassung",
  "tags": ["tag1", "tag2", "tag3"],
  "strength": 0.5-1.0
}

Nur JSON, kein anderer Text.` }],
    });

    const text = msg.content[0].text.trim();
    const parsed = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, ''));
    return res.json(parsed);
  } catch (e) {
    return fail(res, 500, e.message);
  }
}
