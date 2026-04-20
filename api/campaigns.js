import { nanoid } from 'nanoid';
import { kv, readBody, fail, envCheck } from './_shared.js';

const INDEX_KEY = 'campaigns:index';
const ITEM_KEY = (id) => `campaign:${id}`;

export default async function handler(req, res) {
  const missing = envCheck();
  if (missing.includes('REDIS_URL')) return fail(res, 500, 'Redis not configured');

  const id = req.query?.id || null;

  try {
    // Collection: /api/campaigns
    if (!id) {
      if (req.method === 'GET') {
        const ids = (await kv.lrange(INDEX_KEY, 0, -1)) || [];
        if (ids.length === 0) return res.status(200).json({ campaigns: [] });
        const items = await Promise.all(ids.map(x => kv.get(ITEM_KEY(x))));
        const campaigns = items.filter(Boolean);
        campaigns.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        return res.status(200).json({ campaigns });
      }

      if (req.method === 'POST') {
        const body = await readBody(req);
        const newId = nanoid(8);
        const now = new Date().toISOString();
        const campaign = {
          id: newId,
          title: body.title || '',
          description: body.description || '',
          question: body.question || '',
          startDate: body.startDate || now.slice(0, 10),
          endDate: body.endDate || null,
          owner: body.owner || '',
          participants: body.participants || [],
          status: 'active',
          tags: body.tags || [],
          createdAt: now,
          updatedAt: now,
        };
        await kv.set(ITEM_KEY(newId), campaign);
        await kv.lpush(INDEX_KEY, newId);
        return res.status(201).json({ campaign });
      }

      return fail(res, 405, 'Method not allowed (collection)');
    }

    // Single item: /api/campaigns?id=xxx
    if (req.method === 'GET') {
      const campaign = await kv.get(ITEM_KEY(id));
      if (!campaign) return fail(res, 404, 'not found');
      return res.status(200).json({ campaign });
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
      return res.status(200).json({ campaign: updated });
    }

    if (req.method === 'DELETE') {
      await kv.del(ITEM_KEY(id));
      await kv.lrem(INDEX_KEY, 0, id);
      return res.status(204).end();
    }

    return fail(res, 405, 'Method not allowed (item)');
  } catch (err) {
    console.error('campaigns error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
