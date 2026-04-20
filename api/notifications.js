import { kv, readBody } from './_shared.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const notifs = JSON.parse(await kv.get('notifications') || '[]');
    const unread = notifs.filter(n => !n.read).length;
    return res.json({ notifications: notifs, unread });
  }

  if (req.method === 'PUT') {
    // Mark all as read
    const notifs = JSON.parse(await kv.get('notifications') || '[]');
    notifs.forEach(n => n.read = true);
    await kv.set('notifications', JSON.stringify(notifs));
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'method not allowed' });
}
