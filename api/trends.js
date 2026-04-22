import { nanoid } from 'nanoid';
import { kv, readBody, fail, envCheck } from './_shared.js';

const INDEX_KEY = 'trends:index';
const ITEM_KEY = (id) => `trend:${id}`;

export default async function handler(req, res) {
  const missing = envCheck();
  if (missing.includes('REDIS_URL')) return fail(res, 500, 'Redis not configured');

  const id = req.query?.id || null;

  try {
    if (!id) {
      if (req.method === 'GET') {
        const ids = (await kv.lrange(INDEX_KEY, 0, -1)) || [];
        if (ids.length === 0) return res.status(200).json({ trends: [] });
        const items = await Promise.all(ids.map(x => kv.get(ITEM_KEY(x))));
        const trends = items.filter(Boolean);
        trends.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        return res.status(200).json({ trends });
      }

      if (req.method === 'POST') {
        const body = await readBody(req);
        const newId = nanoid(10);
        const now = new Date().toISOString();
        const trend = {
          id: newId,
          title: (body.title || 'Neuer Trend').trim(),
          dim: body.dim || 'Technology',
          horizon: body.horizon || 'H2 · 2–5 yrs',
          stage: body.stage || 'Signal',
          impact: clampInt(body.impact, 50),
          novelty: clampInt(body.novelty, 50),
          maturity: clampInt(body.maturity, 50),
          signals: 0,
          sources: 0,
          owner: (body.owner || 'Ich').trim(),
          ai: 0,
          tags: parseTags(body.tags),
          summary: (body.summary || '').trim(),
          imageUrl: body.imageUrl || null,
          subscribed: body.subscribed || false,
          createdAt: now,
          updatedAt: now,
          custom: true,
        };
        await kv.set(ITEM_KEY(newId), trend);
        await kv.lpush(INDEX_KEY, newId);
        return res.status(201).json({ trend });
      }

      return fail(res, 405, 'Method not allowed (collection)');
    }

    if (req.method === 'GET') {
      const trend = await kv.get(ITEM_KEY(id));
      if (!trend) return fail(res, 404, 'not found');
      return res.status(200).json({ trend });
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
        tags: body.tags !== undefined ? parseTags(body.tags) : current.tags,
      };
      await kv.set(ITEM_KEY(id), updated);
      return res.status(200).json({ trend: updated });
    }

    if (req.method === 'DELETE') {
      await kv.del(ITEM_KEY(id));
      await kv.lrem(INDEX_KEY, 0, id);
      return res.status(204).end();
    }

    return fail(res, 405, 'Method not allowed (item)');
  } catch (err) {
    console.error('trends error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}

function clampInt(v, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(0, Math.min(100, n));
}

function parseTags(input) {
  if (Array.isArray(input)) return input.map(t => String(t).trim()).filter(Boolean).slice(0, 10);
  if (typeof input === 'string') {
    return input.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10);
  }
  return [];
}
