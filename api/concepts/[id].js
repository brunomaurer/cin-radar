import { kv, readBody, fail, envCheck } from '../_shared.js';

const INDEX_KEY = 'concepts:index';
const ITEM_KEY = (id) => `concept:${id}`;

export default async function handler(req, res) {
  const missing = envCheck();
  if (missing.includes('REDIS_URL')) return fail(res, 500, 'Redis not configured');

  const { id } = req.query;
  if (!id) return fail(res, 400, 'id required');

  try {
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

    return fail(res, 405, 'Method not allowed');
  } catch (err) {
    console.error('concept [id] error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
