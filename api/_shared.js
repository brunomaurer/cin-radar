import Anthropic from '@anthropic-ai/sdk';
import Redis from 'ioredis';

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const MODEL = 'claude-sonnet-4-6';

const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
let _redis = null;
function getRedis() {
  if (!_redis && redisUrl) {
    _redis = new Redis(redisUrl, { maxRetriesPerRequest: 2, enableReadyCheck: false });
  }
  return _redis;
}

// Minimal KV-compatible wrapper — values are JSON-serialised automatically.
export const kv = {
  async get(key) {
    const r = getRedis(); if (!r) throw new Error('Redis not configured');
    const s = await r.get(key);
    if (s == null) return null;
    try { return JSON.parse(s); } catch { return s; }
  },
  async set(key, value, opts) {
    const r = getRedis(); if (!r) throw new Error('Redis not configured');
    if (opts?.ex) return r.set(key, JSON.stringify(value), 'EX', opts.ex);
    return r.set(key, JSON.stringify(value));
  },
  async del(key) {
    const r = getRedis(); if (!r) throw new Error('Redis not configured');
    return r.del(key);
  },
  async lrange(key, start, stop) {
    const r = getRedis(); if (!r) throw new Error('Redis not configured');
    return r.lrange(key, start, stop);
  },
  async lpush(key, ...values) {
    const r = getRedis(); if (!r) throw new Error('Redis not configured');
    return r.lpush(key, ...values);
  },
  async lrem(key, count, value) {
    const r = getRedis(); if (!r) throw new Error('Redis not configured');
    return r.lrem(key, count, value);
  },
};

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); }
    });
  });
}

export function fail(res, status, message, extra) {
  return res.status(status).json({ error: message, ...extra });
}

export function envCheck() {
  const missing = [];
  if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');
  if (!process.env.REDIS_URL && !process.env.KV_URL) missing.push('REDIS_URL');
  return missing;
}
