import { anthropic, readBody } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { cluster, signals } = await readBody(req);

  const prompt = `Du bist ein Innovation-Analyst. Aus dem folgenden Cluster und seinen Signalen, erstelle einen Trend-Steckbrief.

Cluster: ${cluster.label}
${cluster.description ? 'Beschreibung: ' + cluster.description : ''}

Signale:
${(signals || []).map((s, i) => (i+1) + '. ' + s.title + (s.summary ? ' — ' + s.summary : '') + (s.source ? ' (Quelle: ' + s.source + ')' : '')).join('\n')}

Antworte als JSON mit exakt diesen Feldern:
{
  "title": "Trend-Titel (prägnant, 3-6 Wörter)",
  "dim": "Technology|Society|Economy|Ecology|Politics|Values",
  "horizon": "H1 · 0–2 yrs|H2 · 2–5 yrs|H3 · 5–10 yrs",
  "stage": "Signal|Emerging|Trend|Mainstream|Fading",
  "impact": 0-100,
  "novelty": 0-100,
  "maturity": 0-100,
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "2-3 Sätze Zusammenfassung des Trends"
}

Nur JSON, kein anderer Text.`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const text = msg.content[0].text.trim();
    const json = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, ''));
    return res.json(json);
  } catch {
    return res.status(500).json({ error: 'Failed to parse AI response', raw: msg.content[0].text });
  }
}
