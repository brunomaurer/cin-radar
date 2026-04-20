import { readBody } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { title, dim, summary } = await readBody(req);

  // Build a descriptive prompt from title, dimension and summary
  const prompt = [
    title || 'innovation trend',
    dim ? `in the field of ${dim}` : '',
    summary ? `— ${summary.slice(0, 150)}` : '',
    'professional editorial photo, clean, modern, soft lighting, no text'
  ].filter(Boolean).join(', ');

  // Pollinations.ai — free AI image generation, no API key needed
  // 600x800 = 3:4 portrait (Hochformat)
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=600&height=800&nologo=true`;

  return res.json({ url });
}
