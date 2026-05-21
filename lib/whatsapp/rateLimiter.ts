const LIMIT = 5;
const WINDOW_MS = 60 * 1000;

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const cache = new Map<string, RateLimitRecord>();

/**
 * Checks if a user is rate limited.
 * Allows up to 5 requests per minute.
 */
export function isRateLimited(jid: string): boolean {
  const now = Date.now();
  const record = cache.get(jid);

  if (!record || now > record.resetTime) {
    cache.set(jid, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return false;
  }

  if (record.count >= LIMIT) {
    return true;
  }

  record.count += 1;
  return false;
}

/**
 * Returns the number of seconds remaining before the rate limit window resets.
 */
export function getRemainingSeconds(jid: string): number {
  const record = cache.get(jid);
  if (!record) return 0;
  return Math.max(0, Math.ceil((record.resetTime - Date.now()) / 1000));
}
