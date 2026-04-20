import { nanoid } from 'nanoid';
import { kv, readBody, fail, envCheck } from './_shared.js';

const INDEX_KEY = 'signals:index';
const ITEM_KEY = (id) => `signal:${id}`;

export default async function handler(req, res) {
  const missing = envCheck();
  if (missing.includes('REDIS_URL')) return fail(res, 500, 'Redis not configured');

  const id = req.query?.id || null;

  try {
    // Collection: /api/signals
    if (!id) {
      if (req.method === 'GET') {
        const ids = (await kv.lrange(INDEX_KEY, 0, -1)) || [];
        if (ids.length === 0) return res.status(200).json({ signals: [] });
        const items = await Promise.all(ids.map(x => kv.get(ITEM_KEY(x))));
        const signals = items.filter(Boolean);
        signals.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        return res.status(200).json({ signals });
      }

      if (req.method === 'POST') {
        const body = await readBody(req);
        const newId = nanoid(8);
        const now = new Date().toISOString();
        const signal = {
          id: newId,
          title: body.title || '',
          summary: body.summary || '',
          source: body.source || '',
          url: body.url || null,
          channel: body.channel || 'manual',
          tags: body.tags || [],
          strength: body.strength ?? 0.5,
          dim: body.dim || null,
          trendId: body.trendId || null,
          campaignId: body.campaignId || null,
          clusterIds: body.clusterIds || [],
          createdAt: now,
          updatedAt: now,
        };
        await kv.set(ITEM_KEY(newId), signal);
        await kv.lpush(INDEX_KEY, newId);
        return res.status(201).json({ signal });
      }

      return fail(res, 405, 'Method not allowed (collection)');
    }

    // Single item: /api/signals?id=xxx
    if (req.method === 'GET') {
      const signal = await kv.get(ITEM_KEY(id));
      if (!signal) return fail(res, 404, 'not found');
      return res.status(200).json({ signal });
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
      return res.status(200).json({ signal: updated });
    }

    if (req.method === 'DELETE') {
      await kv.del(ITEM_KEY(id));
      await kv.lrem(INDEX_KEY, 0, id);
      return res.status(204).end();
    }

    return fail(res, 405, 'Method not allowed (item)');
  } catch (err) {
    console.error('signals error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
