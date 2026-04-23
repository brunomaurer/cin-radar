import { kv, readBody, fail, envCheck } from './_shared.js';

const INDEX_KEY = 'trends:index';
const ITEM_KEY = (id) => `trend:${id}`;

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return fail(res, 405, 'Method not allowed');

  const missing = envCheck();
  if (missing.includes('REDIS_URL')) return fail(res, 500, 'Redis not configured');

  try {
    const ids = (await kv.lrange(INDEX_KEY, 0, -1)) || [];
    if (ids.length === 0) return res.status(200).json({ removed: 0, groups: [] });

    const items = await Promise.all(ids.map(id => kv.get(ITEM_KEY(id))));
    const trends = items.filter(Boolean);

    // Body (nur bei POST) kann preferredTitles enthalten — Titel der Mock-
    // Trends. Customs mit diesen Titeln werden komplett entfernt (Mock ist
    // kanonisch), nicht nur "alle ausser dem ältesten".
    let preferredTitles = new Set();
    if (req.method === 'POST') {
      const body = await readBody(req);
      preferredTitles = new Set(
        (body?.preferredTitles || [])
          .map(s => String(s || '').trim().toLowerCase())
          .filter(Boolean)
      );
    }

    // Gruppiere nach normalisiertem Titel (case-insensitive, getrimmt)
    const byTitle = new Map();
    for (const t of trends) {
      const key = (t.title || '').trim().toLowerCase();
      if (!key) continue;
      if (!byTitle.has(key)) byTitle.set(key, []);
      byTitle.get(key).push(t);
    }

    const toRemove = [];
    const groups = [];
    for (const [titleKey, list] of byTitle) {
      if (preferredTitles.has(titleKey)) {
        // Ein Mock-Trend existiert mit diesem Titel → alle Custom-Einträge weg
        toRemove.push(...list.map(t => t.id));
        groups.push({ title: list[0].title, kept: '(mock)', removed: list.map(t => t.id), reason: 'mock-wins' });
      } else if (list.length > 1) {
        // Nur Customs, davon mehrere → behalte den ältesten
        list.sort((a, b) => (a.createdAt || '0').localeCompare(b.createdAt || '0'));
        const keep = list[0];
        const remove = list.slice(1);
        groups.push({ title: keep.title, kept: keep.id, removed: remove.map(t => t.id), reason: 'oldest-wins' });
        toRemove.push(...remove.map(t => t.id));
      }
    }

    // Wenn GET: nur anzeigen was aufgeräumt werden WÜRDE (dry-run)
    if (req.method === 'GET') {
      return res.status(200).json({ removed: 0, wouldRemove: toRemove.length, groups, totalTrends: trends.length });
    }

    // Tatsächlich löschen
    for (const id of toRemove) {
      await kv.del(ITEM_KEY(id));
      await kv.lrem(INDEX_KEY, 0, id);
      await kv.del('relations:' + id);
    }

    return res.status(200).json({ removed: toRemove.length, groups, totalTrends: trends.length - toRemove.length });
  } catch (err) {
    console.error('trends-dedupe error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
