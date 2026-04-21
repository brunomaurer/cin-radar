import { anthropic, readBody, fail, envCheck } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'POST only');

  const missing = envCheck();
  if (missing.includes('ANTHROPIC_API_KEY')) return fail(res, 500, 'Anthropic API key not configured');

  try {
    const { title, ideas, tags } = await readBody(req);
    if (!ideas || ideas.length === 0) return fail(res, 400, 'ideas array required');

    const prompt = `Du bist ein Innovation-Analyst. Analysiere die folgenden Ideen aus einer Kampagne und schlage 2-4 Trend-Kandidaten vor.

Kampagne: ${title || 'Unnamed'}
${tags && tags.length > 0 ? `Streams/Themen: ${tags.join(', ')}` : ''}

Ideen:
${ideas.map((i, idx) => `${idx + 1}. ${i.text}${i.tags && i.tags.length > 0 ? ' [' + i.tags.join(', ') + ']' : ''}`).join('\n')}

Erstelle für jeden Trend-Kandidaten ein JSON-Objekt. Gruppiere ähnliche Ideen zu Trends.

Antworte NUR als JSON-Array:
[
  {
    "title": "Trend-Titel (prägnant, 3-6 Wörter)",
    "confidence": 0.5-1.0,
    "sourceIdeas": [1, 3, 5],
    "summary": "1-2 Sätze warum dieser Trend relevant ist",
    "stream": "zugehöriger Stream/Tag falls passend"
  }
]

Nur JSON, kein anderer Text.`;

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].text.trim();
    const parsed = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, ''));

    return res.json({ proposals: Array.isArray(parsed) ? parsed : [] });
  } catch (e) {
    return fail(res, 500, e.message);
  }
}
