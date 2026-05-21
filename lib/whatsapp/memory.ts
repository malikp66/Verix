interface ConversationContext {
  lastImage?: {
    data: string; // Base64 encoded string
    mimeType: string;
  };
  lastUrl?: string;
  timestamp: number;
}

const memory = new Map<string, ConversationContext>();
const MEMORY_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Updates context memory for a user.
 */
export function setContext(jid: string, update: Partial<Omit<ConversationContext, 'timestamp'>>): void {
  const existing = memory.get(jid) || { timestamp: Date.now() };
  memory.set(jid, {
    ...existing,
    ...update,
    timestamp: Date.now(),
  });
}

/**
 * Retrieves valid context memory for a user.
 * Prunes expired entries.
 */
export function getContext(jid: string): ConversationContext | undefined {
  const record = memory.get(jid);
  if (!record) return undefined;

  const isExpired = Date.now() - record.timestamp > MEMORY_TTL_MS;
  if (isExpired) {
    memory.delete(jid);
    return undefined;
  }

  return record;
}

/**
 * Clears the conversation context for a user.
 */
export function clearContext(jid: string): void {
  memory.delete(jid);
}

/**
 * Prunes all expired context entries.
 */
export function pruneMemory(): void {
  const now = Date.now();
  for (const [jid, record] of memory.entries()) {
    if (now - record.timestamp > MEMORY_TTL_MS) {
      memory.delete(jid);
    }
  }
}

// Automatically prune memory every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(pruneMemory, 60 * 1000);
}
