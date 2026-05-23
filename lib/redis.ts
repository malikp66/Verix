import Redis from "ioredis";

let client: Redis | null = null;
const memoryCache = new Map<string, { data: any; expiry: number }>();

function getClient(): Redis | null {
  if (!client && process.env.REDIS_URL) {
    try {
      client = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 100, 2000),
        enableOfflineQueue: false,
      });
      client.on("error", (err) => {
        console.warn("[Redis] Connection error, falling back to in-memory:", err.message);
        client = null;
      });
    } catch (e) {
      console.warn("[Redis] Failed to create client, using in-memory cache:", e);
    }
  }
  return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getClient();
  if (r) {
    try {
      const val = await r.get(key);
      if (val) return JSON.parse(val) as T;
    } catch (e) {
      console.warn(`[Redis] GET ${key} failed:`, e);
    }
  }
  const mem = memoryCache.get(key);
  if (mem && mem.expiry > Date.now()) return mem.data as T;
  if (mem) memoryCache.delete(key);
  return null;
}

export async function cacheSet(key: string, value: any, ttlSeconds: number): Promise<void> {
  const r = getClient();
  const str = JSON.stringify(value);
  if (r) {
    try {
      await r.setex(key, ttlSeconds, str);
      return;
    } catch (e) {
      console.warn(`[Redis] SET ${key} failed:`, e);
    }
  }
  memoryCache.set(key, { data: value, expiry: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  const r = getClient();
  if (r) {
    try { await r.del(key); } catch (e) { console.warn(`[Redis] DEL ${key} failed:`, e); }
  }
  memoryCache.delete(key);
}
