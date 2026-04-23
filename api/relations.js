import { anthropic, kv, readBody, fail, envCheck } from './_shared.js';

// Haiku ist schnell + günstig und reicht für Ranking-Aufgaben.
const MODEL = 'claude-haiku-4-5-20251001';
const CACHE_TTL_SEC = 24 * 60 * 60; // 24h
const CACHE_KEY = (trendId) => `relations:${trendId}`;

export const config = { maxDuration: 30 };

const SYSTEM = `Du bist ein Analyst für Trend-Zusammenhänge. Aufgabe: Für einen gegebenen Trend die thematisch ähnlichsten Trends aus einer Kandidatenliste finden.

Bewerte Ähnlichkeit anhand: Thema-Überlapp (hauptsächlich), Dimensions-Nähe (sekundär), Tag-Überlapp, und ob ein Trend Treiber oder Folge des anderen ist.

Antworte NUR als valides JSON ohne Code-Fences, in folgendem Schema:
{
  "related": [
    { "id": "<trend-id>", "score": 0.85, "reason": "Ein kurzer Grund (max 15 Worte) warum diese beiden Trends zusammenhängen." }
  ]
}

score ist zwischen 0 und 1. Gib die 6 ähnlichsten zurück. Sprache der reason-Texte: Deutsch.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');

  const missing = envCheck();
  if (missing.includes('ANTHROPIC_API_KEY')) return fail(res, 500, 'ANTHROPIC_API_KEY not set');
  if (missing.includes('REDIS_URL')) return fail(res, 500, 'Redis not configured');

  try {
    const body = await readBody(req);
    const { trend, candidates, force } = body;
    if (!trend?.id) return fail(res, 400, 'trend required');
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(200).json({ related: [] });
    }

    if (!force) {
      const cached = await kv.get(CACHE_KEY(trend.id));
      if (cached && cached.signature === signatureOf(trend, candidates)) {
        return res.status(200).json({ related: cached.related, cached: true });
      }
    }

    const userMessage = `Hauptfrage-Trend:
id: ${trend.id}
Titel: ${trend.title}
Dimension: ${trend.dim}
Tags: ${(trend.tags || []).join(', ')}
Summary: ${trend.summary || '(keine)'}

Kandidaten (andere Trends):
${candidates.map(c => `- id: ${c.id}
  Titel: ${c.title}
  Dimension: ${c.dim}
  Tags: ${(c.tags || []).join(', ')}
  Summary: ${(c.summary || '(keine)').slice(0, 200)}`).join('\n\n')}

Gib die 6 thematisch ähnlichsten als JSON zurück.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    });

    let text = response.content.map(b => b.text || '').join('').trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed;
    try { parsed = JSON.parse(text); }
    catch { return fail(res, 500, 'Invalid AI response', { raw: text.slice(0, 400) }); }

    const related = (parsed.related || [])
      .filter(r => r && r.id && candidates.some(c => c.id === r.id))
      .slice(0, 6);

    const payload = { related, signature: signatureOf(trend, candidates) };
    await kv.set(CACHE_KEY(trend.id), payload, { ex: CACHE_TTL_SEC });

    return res.status(200).json({ related, cached: false });
  } catch (err) {
    console.error('relations error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}

function signatureOf(trend, candidates) {
  // candidates-IDs sortiert aufnehmen, damit Cache invalidiert wenn
  // ein Kandidat gelöscht oder hinzugefügt wurde (nicht nur bei Änderung
  // der Anzahl).
  const parts = [
    trend.id, trend.title, trend.dim, (trend.tags || []).join(','), trend.summary || '',
    candidates.map(c => c.id).sort().join(','),
  ];
  return parts.join('|').slice(0, 800);
}
