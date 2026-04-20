import { anthropic, kv, readBody } from './_shared.js';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { trend } = await readBody(req);
  if (!trend?.id || !trend?.title) return res.status(400).json({ error: 'trend with id and title required' });

  const prompt = `Du bist ein Innovation-Scout. Finde 3-5 aktuelle, realistische Signale zum folgenden Trend.

Trend: ${trend.title}
Dimension: ${trend.dim || ''}
Zusammenfassung: ${trend.summary || ''}
Tags: ${(trend.tags || []).join(', ')}

Erstelle für jedes Signal ein JSON-Objekt. Signale sind konkrete Beobachtungen: Artikel, Studien, Produktlaunches, Investments, Policy-Änderungen.

Antworte NUR als JSON-Array:
[
  {
    "title": "Konkreter Titel des Signals (wie eine Headline)",
    "source": "Quellenname (z.B. TechCrunch, Reuters, Nature)",
    "summary": "1-2 Sätze was passiert ist",
    "type": "Product|Research|Policy|Funding|Corp|Adoption|Market",
    "strength": 0.5-1.0,
    "tags": ["tag1", "tag2"]
  }
]

Nur JSON, kein anderer Text. Signale sollen realistisch und aktuell klingen.`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].text.trim();
    const parsed = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, ''));

    if (!Array.isArray(parsed)) return res.status(500).json({ error: 'AI did not return array' });

    // Store each signal in Redis
    const created = [];
    for (const s of parsed) {
      const sig = {
        id: nanoid(8),
        title: s.title || '',
        summary: s.summary || '',
        source: s.source || '',
        url: null,
        channel: 'ai-scout',
        tags: s.tags || [],
        strength: s.strength ?? 0.7,
        type: s.type || 'Research',
        dim: trend.dim || null,
        trendId: trend.id,
        campaignId: null,
        clusterIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const ids = JSON.parse(await kv.get('signals:index') || '[]');
      ids.push(sig.id);
      await kv.set('signals:index', JSON.stringify(ids));
      await kv.set(`signal:${sig.id}`, JSON.stringify(sig));
      created.push(sig);
    }

    // Store notification
    const notif = {
      id: nanoid(8),
      type: 'new-signals',
      trendId: trend.id,
      trendTitle: trend.title,
      count: created.length,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const notifs = JSON.parse(await kv.get('notifications') || '[]');
    notifs.unshift(notif);
    await kv.set('notifications', JSON.stringify(notifs.slice(0, 50)));

    return res.json({ signals: created, count: created.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
