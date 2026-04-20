import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the _shared module before importing handler
vi.mock('../_shared.js', () => {
  const store = new Map();
  const lists = new Map();

  return {
    anthropic: {},
    MODEL: 'test-model',
    kv: {
      get: vi.fn(async (key) => store.get(key) ?? null),
      set: vi.fn(async (key, value) => { store.set(key, value); }),
      del: vi.fn(async (key) => { store.delete(key); }),
      lrange: vi.fn(async (key) => lists.get(key) ?? []),
      lpush: vi.fn(async (key, ...values) => {
        const list = lists.get(key) || [];
        lists.set(key, [...values, ...list]);
      }),
      lrem: vi.fn(async (key, _count, value) => {
        const list = lists.get(key) || [];
        lists.set(key, list.filter(v => v !== value));
      }),
    },
    readBody: vi.fn(async (req) => req.body || {}),
    fail: vi.fn((res, status, message) => res.status(status).json({ error: message })),
    envCheck: vi.fn(() => []),
    // expose internals for test setup
    _store: store,
    _lists: lists,
  };
});

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test1234'),
}));

import handler from '../signals.js';
import { kv, _store, _lists } from '../_shared.js';

function mockRes() {
  const res = {
    _status: null,
    _json: null,
    _ended: false,
    status(code) { res._status = code; return res; },
    json(data) { res._json = data; return res; },
    end() { res._ended = true; return res; },
  };
  return res;
}

function mockReq(method, query = {}, body = null) {
  return { method, query, body };
}

beforeEach(() => {
  _store.clear();
  _lists.clear();
  vi.clearAllMocks();
});

describe('GET /api/signals (collection)', () => {
  it('returns empty signals array when index is empty', async () => {
    const req = mockReq('GET');
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json).toEqual({ signals: [] });
  });

  it('returns sorted signals list by createdAt descending', async () => {
    const sig1 = { id: 'a1', title: 'Older', createdAt: '2025-01-01T00:00:00Z' };
    const sig2 = { id: 'a2', title: 'Newer', createdAt: '2025-06-01T00:00:00Z' };

    _store.set('signal:a1', sig1);
    _store.set('signal:a2', sig2);
    _lists.set('signals:index', ['a1', 'a2']);

    const req = mockReq('GET');
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.signals).toHaveLength(2);
    // Newer first
    expect(res._json.signals[0].id).toBe('a2');
    expect(res._json.signals[1].id).toBe('a1');
  });

  it('filters out null items from the list', async () => {
    // Index references an id but the key was deleted
    _lists.set('signals:index', ['gone']);

    const req = mockReq('GET');
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.signals).toHaveLength(0);
  });
});

describe('POST /api/signals', () => {
  it('creates a signal with nanoid and timestamps', async () => {
    const req = mockReq('POST', {}, { title: 'New Signal', source: 'Unit Test', strength: 0.9 });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(201);
    const created = res._json.signal;
    expect(created.id).toBe('test1234');
    expect(created.title).toBe('New Signal');
    expect(created.source).toBe('Unit Test');
    expect(created.strength).toBe(0.9);
    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBe(created.createdAt);

    // Verify kv was called correctly
    expect(kv.set).toHaveBeenCalledWith('signal:test1234', expect.objectContaining({ id: 'test1234' }));
    expect(kv.lpush).toHaveBeenCalledWith('signals:index', 'test1234');
  });

  it('applies default values for missing fields', async () => {
    const req = mockReq('POST', {}, {});
    const res = mockRes();
    await handler(req, res);

    const created = res._json.signal;
    expect(created.title).toBe('');
    expect(created.channel).toBe('manual');
    expect(created.tags).toEqual([]);
    expect(created.strength).toBe(0.5);
    expect(created.url).toBeNull();
  });
});

describe('PUT /api/signals?id=xxx', () => {
  it('patches an existing signal preserving id and createdAt', async () => {
    const original = {
      id: 'x1', title: 'Original', source: 'test',
      createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    };
    _store.set('signal:x1', original);

    const req = mockReq('PUT', { id: 'x1' }, { title: 'Updated Title', source: 'new source' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    const updated = res._json.signal;
    expect(updated.title).toBe('Updated Title');
    expect(updated.source).toBe('new source');
    expect(updated.id).toBe('x1'); // id preserved
    expect(updated.createdAt).toBe('2025-01-01T00:00:00Z'); // createdAt preserved
    expect(updated.updatedAt).not.toBe('2025-01-01T00:00:00Z'); // updatedAt changed
  });

  it('returns 404 for non-existent signal', async () => {
    const req = mockReq('PUT', { id: 'nope' }, { title: 'X' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(404);
  });
});

describe('DELETE /api/signals?id=xxx', () => {
  it('removes signal from store and index', async () => {
    _store.set('signal:d1', { id: 'd1', title: 'Doomed' });
    _lists.set('signals:index', ['d1']);

    const req = mockReq('DELETE', { id: 'd1' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(204);
    expect(res._ended).toBe(true);
    expect(kv.del).toHaveBeenCalledWith('signal:d1');
    expect(kv.lrem).toHaveBeenCalledWith('signals:index', 0, 'd1');
  });
});

describe('GET /api/signals?id=xxx (single)', () => {
  it('returns a single signal', async () => {
    _store.set('signal:s1', { id: 's1', title: 'Found' });
    const req = mockReq('GET', { id: 's1' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.signal.title).toBe('Found');
  });

  it('returns 404 for missing signal', async () => {
    const req = mockReq('GET', { id: 'missing' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(404);
  });
});

describe('method not allowed', () => {
  it('returns 405 for unsupported method on collection', async () => {
    const req = mockReq('PATCH');
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(405);
  });

  it('returns 405 for unsupported method on item', async () => {
    const req = mockReq('PATCH', { id: 'x1' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(405);
  });
});
