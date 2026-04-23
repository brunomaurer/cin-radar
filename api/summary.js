import { anthropic, readBody, fail, envCheck } from './_shared.js';

const MODEL = 'claude-sonnet-4-6';
export const config = { maxDuration: 30 };

const SYSTEM = `Du bist ein Executive Coach für Innovation und Strategie. Du bekommst eine Auswahl an Trend-Steckbriefen und erstellst daraus einen Management-Summary für C-Level und Leitungsteams.

Analysiere die Trends im Zusammenhang. Erkenne Muster, Cluster und strategische Implikationen. Vermeide generische Beratersprache — sei konkret, konzise und mutig in Empfehlungen.

Antworte NUR als valides JSON ohne Code-Fences nach genau diesem Schema:
{
  "executiveSummary": "3-5 Sätze, was diese Trend-Gruppe strategisch bedeutet und warum jetzt gehandelt werden sollte.",
  "keyInsights": ["Max 5 prägnante Erkenntnisse, Bullet-Style, je 1-2 Sätze."],
  "recommendations": {
    "shortTerm": ["0-6 Monate: konkrete Aktionen, je 1 Satz."],
    "midTerm": ["6-18 Monate: je 1 Satz."],
    "longTerm": ["18+ Monate: je 1 Satz."]
  },
  "opportunities": [{ "text": "Konkrete Chance, 1-2 Sätze.", "trendTitle": "Titel des referenzierten Trends" }],
  "risks": [{ "text": "Konkretes Risiko, 1-2 Sätze.", "trendTitle": "Titel des referenzierten Trends" }]
}

Sprache: Deutsch. Alle Listen maximal 5 Einträge. keyInsights mindestens 3.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');

  const missing = envCheck();
  if (missing.includes('ANTHROPIC_API_KEY')) return fail(res, 500, 'ANTHROPIC_API_KEY not set');

  try {
    const body = await readBody(req);
    const { trends } = body;
    if (!Array.isArray(trends) || trends.length === 0) {
      return fail(res, 400, 'trends[] required');
    }

    const userMessage = `Analysiere diese ${trends.length} Trend-Steckbriefe und schreibe den Management-Summary:

${trends.map((t, i) => `--- Trend ${i + 1} ---
Titel: ${t.title}
Dimension: ${t.dim}
Horizont: ${t.horizon}
Stage: ${t.stage}
Impact: ${t.impact}/100 · Novelty: ${t.novelty}/100 · Maturity: ${t.maturity}/100
Signale: ${t.signals || 0} · Quellen: ${t.sources || 0}
Tags: ${(t.tags || []).join(', ') || '—'}
Summary: ${t.summary || '(keine Zusammenfassung)'}
Owner: ${t.owner || '—'}`).join('\n\n')}

Liefere den strukturierten Management-Summary als JSON.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    });

    let text = response.content.map(b => b.text || '').join('').trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed;
    try { parsed = JSON.parse(text); }
    catch { return fail(res, 500, 'Invalid AI response', { raw: text.slice(0, 500) }); }

    return res.status(200).json({ summary: parsed, trendCount: trends.length });
  } catch (err) {
    console.error('summary error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
