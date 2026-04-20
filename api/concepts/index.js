import { nanoid } from 'nanoid';
import { kv, readBody, fail, envCheck } from '../_shared.js';

const INDEX_KEY = 'concepts:index';
const ITEM_KEY = (id) => `concept:${id}`;

export default async function handler(req, res) {
  const missing = envCheck();
  if (missing.includes('REDIS_URL')) return fail(res, 500, 'Redis not configured');

  try {
    if (req.method === 'GET') {
      const ids = (await kv.lrange(INDEX_KEY, 0, -1)) || [];
      if (ids.length === 0) return res.status(200).json({ concepts: [] });
      const items = await Promise.all(ids.map(id => kv.get(ITEM_KEY(id))));
      const concepts = items.filter(Boolean).map(c => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        hasArtefacts: !!(c.artefacts && Object.keys(c.artefacts).length > 0),
      }));
      concepts.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      return res.status(200).json({ concepts });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const id = nanoid(10);
      const now = new Date().toISOString();
      const concept = {
        id,
        title: body.title || 'Neues MVP-Konzept',
        createdAt: now,
        updatedAt: now,
        brief: body.brief || { problem: '', audience: '', metric: '', timeframe: '', budget: '' },
        artefacts: null,
        chat: [],
        trendId: body.trendId || null,
      };
      await kv.set(ITEM_KEY(id), concept);
      await kv.lpush(INDEX_KEY, id);
      return res.status(201).json({ concept });
    }

    return fail(res, 405, 'Method not allowed');
  } catch (err) {
    console.error('concepts error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
