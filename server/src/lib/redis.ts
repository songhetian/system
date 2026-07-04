import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connected = false;
let mockStore = new Map<string, { value: string; expiresAt: number | null }>();

async function tryConnect(): Promise<boolean> {
  if (connected) return true;
  try {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: { connectTimeout: 2000, reconnectStrategy: false },
    });
    await client.connect();
    connected = true;
    return true;
  } catch {
    connected = false;
    return false;
  }
}

export const redis = {
  async get(key: string): Promise<string | null> {
    if (await tryConnect()) return client!.get(key);
    const item = mockStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) { mockStore.delete(key); return null; }
    return item.value;
  },
  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    if (await tryConnect()) {
      if (options?.EX) await client!.setEx(key, options.EX, value);
      else await client!.set(key, value);
      return;
    }
    mockStore.set(key, { value, expiresAt: options?.EX ? Date.now() + options.EX * 1000 : null });
  },
  async del(key: string): Promise<void> {
    if (await tryConnect()) { await client!.del(key); return; }
    mockStore.delete(key);
  },
  async exists(key: string): Promise<boolean> {
    if (await tryConnect()) return (await client!.exists(key)) === 1;
    const item = mockStore.get(key);
    if (!item) return false;
    if (item.expiresAt && Date.now() > item.expiresAt) { mockStore.delete(key); return false; }
    return true;
  },
  async hget(key: string, field: string): Promise<string | null> {
    if (await tryConnect()) return client!.hGet(key, field);
    const item = mockStore.get(key);
    if (!item) return null;
    try { return JSON.parse(item.value)[field] ?? null; } catch { return null; }
  },
  async hset(key: string, field: string, value: string): Promise<void> {
    if (await tryConnect()) { await client!.hSet(key, field, value); return; }
    const existing = mockStore.get(key);
    const obj = existing ? JSON.parse(existing.value) : {};
    obj[field] = value;
    mockStore.set(key, { value: JSON.stringify(obj), expiresAt: existing?.expiresAt ?? null });
  },
  async keys(pattern: string): Promise<string[]> {
    if (await tryConnect()) return client!.keys(pattern);
    const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return [...mockStore.keys()].filter(k => regex.test(k));
  },
  async flushAll(): Promise<void> {
    if (await tryConnect()) { await client!.flushAll(); return; }
    mockStore.clear();
  },
};

export async function getCache<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

export async function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  await redis.set(key, JSON.stringify(value), ttlSeconds ? { EX: ttlSeconds } : undefined);
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  for (const k of keys) await redis.del(k);
}
