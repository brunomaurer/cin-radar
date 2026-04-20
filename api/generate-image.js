import { readBody } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { title, tags } = await readBody(req);
  const query = encodeURIComponent([title, ...(tags || []).slice(0, 2)].join(' '));
  const url = `https://source.unsplash.com/800x400/?${query}`;
  return res.json({ url });
}
