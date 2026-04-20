import { nanoid } from 'nanoid';
import { kv, readBody, fail, envCheck } from './_shared.js';

const INDEX_KEY = 'concepts:index';
const ITEM_KEY = (id) => `concept:${id}`;

export default async function handler(req, res) {
  const missing = envCheck();
  if (missing.includes('REDIS_URL')) return fail(res, 500, 'Redis not configured');

  const id = req.query?.id || null;

  try {
    // Collection: /api/concepts
    if (!id) {
      if (req.method === 'GET') {
        const ids = (await kv.lrange(INDEX_KEY, 0, -1)) || [];
        if (ids.length === 0) return res.status(200).json({ concepts: [] });
        const items = await Promise.all(ids.map(x => kv.get(ITEM_KEY(x))));
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
        const newId = nanoid(10);
        const now = new Date().toISOString();
        const concept = {
          id: newId,
          title: body.title || 'Neues MVP-Konzept',
          createdAt: now,
          updatedAt: now,
          brief: body.brief || { problem: '', audience: '', metric: '', timeframe: '', budget: '' },
          artefacts: null,
          chat: [],
          trendId: body.trendId || null,
        };
        await kv.set(ITEM_KEY(newId), concept);
        await kv.lpush(INDEX_KEY, newId);
        return res.status(201).json({ concept });
      }

      return fail(res, 405, 'Method not allowed (collection)');
    }

    // Single item: /api/concepts?id=xxx
    if (req.method === 'GET') {
      const concept = await kv.get(ITEM_KEY(id));
      if (!concept) return fail(res, 404, 'not found');
      return res.status(200).json({ concept });
    }

    if (req.method === 'PUT') {
      const body = await readBody(req);
      const current = await kv.get(ITEM_KEY(id));
      if (!current) return fail(res, 404, 'not found');
      const updated = {
        ...current,
        ...body,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      await kv.set(ITEM_KEY(id), updated);
      return res.status(200).json({ concept: updated });
    }

    if (req.method === 'DELETE') {
      await kv.del(ITEM_KEY(id));
      await kv.lrem(INDEX_KEY, 0, id);
      return res.status(204).end();
    }

    return fail(res, 405, 'Method not allowed (item)');
  } catch (err) {
    console.error('concepts error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
