import { anthropic, kv, readBody, fail, envCheck } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'POST only');

  const missing = envCheck();
  if (missing.includes('ANTHROPIC_API_KEY')) return fail(res, 500, 'Anthropic API key not configured');

  try {
    const { title, question, description } = await readBody(req);
    if (!title) return fail(res, 400, 'title is required');

    const prompt = `You are a creative foresight analyst helping to brainstorm ideas for a trend-scouting campaign.

Campaign title: ${title}
${question ? `Guiding question: ${question}` : ''}
${description ? `Description: ${description}` : ''}

Generate 5-8 diverse idea seeds that could be relevant signals, observations, or hypotheses for this campaign. Each idea should be a concrete observation, news snippet, or provocative hypothesis — not generic.

Return a JSON array where each item has:
- "text": the idea text (1-3 sentences, concrete and specific)
- "type": one of "signal", "hypothesis", "observation", "question"
- "tags": array of 2-3 relevant short tags

Return ONLY the JSON array, no other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();
    let ideas;
    try {
      // Handle potential markdown code blocks
      const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      ideas = JSON.parse(cleaned);
    } catch {
      return fail(res, 500, 'Failed to parse AI response', { raw });
    }

    return res.status(200).json({ ideas });
  } catch (err) {
    console.error('generate-ideas error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
