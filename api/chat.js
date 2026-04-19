import { anthropic, MODEL, readBody, fail, envCheck } from './_shared.js';

export const config = { maxDuration: 30 };

const COACH_SYSTEM = `Du bist ein erfahrener MVP-Coach und Product-Engineer. Du hilfst dem User, aus einer vagen Idee einen schlanken, buildbaren MVP zu machen.

Deine Prinzipien:
- Stelle scharfe, konkrete Fragen. Frag nie mehr als zwei auf einmal.
- Schneide Scope. Frag "Was gehört NICHT in den MVP?" genauso wichtig wie "Was rein?"
- Denk in Evidenz: Welches Signal belegt das Problem? Wer hat wirklich gefragt?
- Empfiehl Tech-Stacks mit Trade-offs, nicht Dogmen.
- Antworte kurz, konkret, ohne Buzzwords. Maximal 6 Zeilen pro Antwort, wenn möglich.
- Antworte in der Sprache des Users (meist Deutsch).

Wenn der User einen Brief teilt, stelle eine scharfe Frage zur schwächsten Stelle. Wenn er über Artefakte redet, gib konkrete Textvorschläge zum Einbauen.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');
  const missing = envCheck();
  if (missing.includes('ANTHROPIC_API_KEY')) return fail(res, 500, 'ANTHROPIC_API_KEY not set');

  try {
    const body = await readBody(req);
    const { messages = [], system, context } = body;

    let systemPrompt = system || COACH_SYSTEM;
    if (context?.brief) {
      systemPrompt += `\n\n<mvp-brief>\n${JSON.stringify(context.brief, null, 2)}\n</mvp-brief>`;
    }
    if (context?.artefact) {
      systemPrompt += `\n\n<current-artefact id="${context.artefact.id}">\n${context.artefact.body}\n</current-artefact>`;
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
        .filter(m => (m.content || m.text) && (m.role || m.who))
        .map(m => ({
          role: m.role || (m.who === 'user' ? 'user' : 'assistant'),
          content: m.content || m.text,
        })),
    });

    const reply = response.content.map(b => b.text || '').join('');
    res.status(200).json({ reply });
  } catch (err) {
    console.error('chat error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
