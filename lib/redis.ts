import Redis from "ioredis";

let client: Redis | null | "DISABLED" = null;
let initPromise: Promise<void> | null = null;
const memoryCache = new Map<string, { data: any; expiry: number }>();
const memorySorted = new Map<string, { score: number; member: string }[]>();

async function initRedis(): Promise<void> {
  if (client !== null) return;
  if (initPromise) return initPromise;
  if (!process.env.REDIS_URL) {
    client = "DISABLED";
    return;
  }
  initPromise = (async () => {
    try {
      const r = new Redis(process.env.REDIS_URL!, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 100, 2000),
        enableOfflineQueue: true,
      });
      await r.connect();
      r.on("error", (err) => {
        console.warn("[Redis] Connection error:", err.message);
      });
      client = r;
      console.log("[Redis] Connected successfully.");
    } catch (e) {
      console.warn("[Redis] Failed to connect, using in-memory cache:", e);
      client = "DISABLED";
    }
  })();
  return initPromise;
}

initRedis();

function getClient(): Redis | null {
  if (client === "DISABLED") return null;
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

// ─── Sorted Set Operations ───

export async function cacheZadd(key: string, score: number, member: string): Promise<number> {
  const r = getClient();
  if (r) {
    try {
      return await r.zadd(key, score, member);
    } catch (e) {
      console.warn(`[Redis] ZADD ${key} failed:`, e);
    }
  }
  let arr = memorySorted.get(key) || [];
  const existing = arr.find(e => e.member === member);
  if (existing) {
    existing.score = score;
  } else {
    arr.push({ score, member });
  }
  arr.sort((a, b) => b.score - a.score);
  memorySorted.set(key, arr);
  return existing ? 0 : 1;
}

export async function cacheZrevrange(key: string, start: number, stop: number): Promise<string[]> {
  const r = getClient();
  if (r) {
    try {
      return await r.zrevrange(key, start, stop);
    } catch (e) {
      console.warn(`[Redis] ZREVRANGE ${key} failed:`, e);
    }
  }
  const arr = memorySorted.get(key) || [];
  return arr.slice(start, stop === -1 ? undefined : stop + 1).map(e => e.member);
}

export async function cacheZrevrangeWithScores(key: string, start: number, stop: number): Promise<{ member: string; score: number }[]> {
  const r = getClient();
  if (r) {
    try {
      const results = await r.zrevrange(key, start, stop, 'WITHSCORES');
      const items: { member: string; score: number }[] = [];
      for (let i = 0; i < results.length; i += 2) {
        items.push({ member: results[i], score: parseFloat(results[i + 1]) });
      }
      return items;
    } catch (e) {
      console.warn(`[Redis] ZREVRANGE WITHSCORES ${key} failed:`, e);
    }
  }
  const arr = memorySorted.get(key) || [];
  return arr.slice(start, stop === -1 ? undefined : stop + 1).map(e => ({ member: e.member, score: e.score }));
}

export async function cacheZremrangeByRank(key: string, start: number, stop: number): Promise<number> {
  const r = getClient();
  if (r) {
    try {
      return await r.zremrangebyrank(key, start, stop);
    } catch (e) {
      console.warn(`[Redis] ZREMRANGEBYRANK ${key} failed:`, e);
    }
  }
  const arr = memorySorted.get(key) || [];
  if (start === 0 && stop === -1) {
    const count = arr.length;
    memorySorted.delete(key);
    return count;
  }
  const endIdx = stop === -1 ? arr.length - 1 : stop;
  const removed = arr.splice(start, endIdx - start + 1);
  memorySorted.set(key, arr);
  return removed.length;
}

export async function cacheZcard(key: string): Promise<number> {
  const r = getClient();
  if (r) {
    try {
      return await r.zcard(key);
    } catch (e) {
      console.warn(`[Redis] ZCARD ${key} failed:`, e);
    }
  }
  return (memorySorted.get(key) || []).length;
}
