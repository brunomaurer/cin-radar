import { anthropic, MODEL, readBody, fail, envCheck } from './_shared.js';

export const config = { maxDuration: 30 };

const ARTEFACT_PROMPTS = {
  claude: {
    label: 'CLAUDE.md',
    system: `Du schreibst eine CLAUDE.md für einen AI-Coding-Agenten. Format: Markdown. Enthalten sein müssen: Projekt-Kontext (1 Absatz), Stack-Auswahl mit Begründung, Verzeichnisstruktur, Conventions (TypeScript-strict, Testing, State-Management), MVP-Features in Priorität, Out-of-Scope, Definition of Done. Kurz, präzise, ohne Fluff. 400-700 Worte.`,
  },
  prd: {
    label: 'PRD',
    system: `Du schreibst eine Product Requirements Document (Markdown). Enthalten: Why, Who, Success-Metric, User-Stories (3-5), Acceptance Criteria in Gherkin-Syntax, Non-Functional Requirements, Out-of-Scope, Open Questions. 400-700 Worte.`,
  },
  tech: {
    label: 'Tech Spec',
    system: `Du schreibst eine Tech-Spec (Markdown). Enthalten: Data Model (konkret, z.B. Prisma- oder SQL-Schema), API-Endpoints, Component-Tree bei Frontend, AI-Pipeline wenn relevant, Observability. 400-700 Worte.`,
  },
  deck: {
    label: 'Management Deck',
    system: `Du schreibst ein 6-Slide Management Deck in Markdown. Slides durch "---" auf eigener Zeile trennen. Jeder Slide: # Titel, dann Inhalt. Slides: 1. Titelseite, 2. Why now (Problem + Evidenz), 3. What we propose (Lösung in 2-3 Sätzen), 4. How it works (Flow in 4 Schritten), 5. Timeline & Budget, 6. What we need (Stakeholder-Asks). Prägnant. 300-500 Worte total.`,
  },
  prompt: {
    label: 'Prototype Prompt',
    system: `Du schreibst einen direkten Copy-Paste Prompt für Claude Code / v0 / Cursor. Format: Plain text (kein Markdown-Header). Instruiere den AI-Agenten: Stack, Aufgabe, Konventionen, erste 5 Schritte, Definition of Done. Adresse: "You are Claude Code. Build..." 200-400 Worte.`,
  },
  email: {
    label: 'Kickoff Email',
    system: `Du schreibst eine Stakeholder-Kickoff-Email in Markdown. Mit Subject-Zeile oben, dann Body. Enthalten: What, Why, Plan (Timeline+Budget), Team, was wir diese Woche von wem brauchen, Kickoff-Meeting. Warm-professioneller Ton. 200-350 Worte. Sprache: Deutsch.`,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');
  const missing = envCheck();
  if (missing.includes('ANTHROPIC_API_KEY')) return fail(res, 500, 'ANTHROPIC_API_KEY not set');

  try {
    const body = await readBody(req);
    const { brief, trend, artefact } = body;
    if (!brief) return fail(res, 400, 'brief required');
    if (!artefact || !ARTEFACT_PROMPTS[artefact]) return fail(res, 400, 'unknown artefact');

    const prompt = ARTEFACT_PROMPTS[artefact];
    const userMessage = `MVP-Titel: ${brief.title || '(ohne Titel)'}

Brief:
- Problem: ${brief.problem || '—'}
- Audience: ${brief.audience || '—'}
- Success-Metric: ${brief.metric || '—'}
- Timeframe: ${brief.timeframe || '—'}
- Budget: ${brief.budget || '—'}

${trend ? `Trend-Kontext: ${trend.title} (${trend.dim}, ${trend.signals} Signale, impact ${trend.impact})` : 'Kein Trend verknüpft.'}

Schreibe jetzt das Artefakt "${prompt.label}".`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: prompt.system,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content.map(b => b.text || '').join('').trim();
    const words = text.split(/\s+/).filter(Boolean).length;

    res.status(200).json({ id: artefact, body: text, words });
  } catch (err) {
    console.error('generate error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
