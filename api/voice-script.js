import { anthropic, readBody, fail, envCheck } from './_shared.js';

const MODEL = 'claude-sonnet-4-6';
export const config = { maxDuration: 30 };

const SYSTEM_BASE = `Du schreibst ein Audio-Briefing, das laut vorgelesen wird. Der Text muss klingen wie ein Business-Podcast, nicht wie ein vorgelesenes Dokument.

Stil:
- Flüssiger Sprechtext, natürliche Übergänge ("Kommen wir zum zweiten Thema", "Besonders interessant ist")
- Keine Listen, keine Nummerierungen, keine Aufzählungszeichen
- Keine Markdown-Zeichen
- Keine Überschriften wie "Trend 1:" — stattdessen den Titel natürlich einführen
- Persönliche Anrede
- Max 2200 Zeichen (ca. 2-3 Minuten Audio)

Struktur:
1. Kurze Begrüssung mit Kontext (1-2 Sätze)
2. Executive Overview — was verbindet diese Trends (2-3 Sätze)
3. Pro Trend: Titel im Satz einbauen, dann 2-3 Sätze zum Wesentlichen, sprachlich eingeleitet
4. Abschluss mit strategischer Pointe (1-2 Sätze)

Antworte NUR mit dem reinen Vorlesetext, keine Meta-Kommentare, kein JSON.`;

const SYSTEM_DE = `${SYSTEM_BASE}

Sprache: Hochdeutsch.`;

const SYSTEM_CH = `${SYSTEM_BASE}

Sprache: Schweizerdeutsch (Züritüütsch-Variante), phonetisch so geschrieben wie es gesprochen wird — die Stimme liest den Text mehr oder weniger Buchstabe für Buchstabe, daher schreib so, dass es natürlich klingt wenn man es laut liest.

Beispiele für Schreibweisen:
- "Grüezi mitenand" statt "Guten Tag zusammen"
- "Mir luegid hüt uf" statt "Wir schauen uns heute"
- "ghörid" statt "hört"
- "isch" statt "ist", "hät" statt "hat", "chunnt" statt "kommt"
- "zäme" statt "zusammen"
- Englisch-Begriffe (z.B. Trends, Impact, AI) lässt du auf Englisch stehen
- Anrede "Sie" → "Sie" (Mundart duzt auch geschäftlich oft, aber bleib bei "Sie" fürs Business-Setting)

Achte auf einfache Mundart-Ausdrücke, keine tief-komplizierten Konstruktionen — der TTS ist auf Hochdeutsch trainiert, das Ergebnis klingt dementsprechend angenähert.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');
  const missing = envCheck();
  if (missing.includes('ANTHROPIC_API_KEY')) return fail(res, 500, 'ANTHROPIC_API_KEY not set');

  try {
    const body = await readBody(req);
    const { trends } = body;
    const language = body.language === 'de-CH' ? 'de-CH' : 'de';
    if (!Array.isArray(trends) || trends.length === 0) return fail(res, 400, 'trends[] required');

    const system = language === 'de-CH' ? SYSTEM_CH : SYSTEM_DE;

    const userMessage = `${trends.length} Trends für das Audio-Briefing:

${trends.map((t, i) => `Trend ${i + 1}: ${t.title}
Dimension: ${t.dim}, Stage: ${t.stage}, Horizont: ${t.horizon}
Impact ${t.impact}/100, Novelty ${t.novelty}/100, Maturity ${t.maturity}/100
Tags: ${(t.tags || []).join(', ') || '—'}
${t.summary || '(keine Zusammenfassung)'}`).join('\n\n')}

Schreibe das Audio-Script.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: userMessage }],
    });

    const script = response.content.map(b => b.text || '').join('').trim();
    return res.status(200).json({ script, chars: script.length, language });
  } catch (err) {
    console.error('voice-script error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
