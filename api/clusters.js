import { nanoid } from 'nanoid';
import { kv, readBody, fail, envCheck } from './_shared.js';

const INDEX_KEY = 'clusters:index';
const ITEM_KEY = (id) => `cluster:${id}`;

export default async function handler(req, res) {
  const missing = envCheck();
  if (missing.includes('REDIS_URL')) return fail(res, 500, 'Redis not configured');

  const id = req.query?.id || null;

  try {
    // Collection: /api/clusters
    if (!id) {
      if (req.method === 'GET') {
        const ids = (await kv.lrange(INDEX_KEY, 0, -1)) || [];
        if (ids.length === 0) return res.status(200).json({ clusters: [] });
        const items = await Promise.all(ids.map(x => kv.get(ITEM_KEY(x))));
        const clusters = items.filter(Boolean);
        clusters.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        return res.status(200).json({ clusters });
      }

      if (req.method === 'POST') {
        const body = await readBody(req);
        const newId = nanoid(8);
        const now = new Date().toISOString();
        const cluster = {
          id: newId,
          label: body.label || '',
          description: body.description || '',
          color: body.color || '#A78BFA',
          confidence: body.confidence ?? null,
          signalIds: body.signalIds || [],
          campaignId: body.campaignId || null,
          origin: body.origin || 'manual',
          proposed: false,
          createdAt: now,
          updatedAt: now,
        };
        await kv.set(ITEM_KEY(newId), cluster);
        await kv.lpush(INDEX_KEY, newId);
        return res.status(201).json({ cluster });
      }

      return fail(res, 405, 'Method not allowed (collection)');
    }

    // Single item: /api/clusters?id=xxx
    if (req.method === 'GET') {
      const cluster = await kv.get(ITEM_KEY(id));
      if (!cluster) return fail(res, 404, 'not found');
      return res.status(200).json({ cluster });
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
      return res.status(200).json({ cluster: updated });
    }

    if (req.method === 'DELETE') {
      await kv.del(ITEM_KEY(id));
      await kv.lrem(INDEX_KEY, 0, id);
      return res.status(204).end();
    }

    return fail(res, 405, 'Method not allowed (item)');
  } catch (err) {
    console.error('clusters error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
