const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000
const DEFAULT_MAX_ENTRIES = 5000

/**
 * Remembers WhatsApp message ids so Meta's webhook retries do not create the
 * same Linear issue twice. In-memory: a restart forgets it, which at worst
 * lets one retry through.
 */
export function createSeenMessages(options?: {
  ttlMs?: number
  maxEntries?: number
  now?: () => number
}) {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS
  const maxEntries = options?.maxEntries ?? DEFAULT_MAX_ENTRIES
  const now = options?.now ?? Date.now
  // Map keeps insertion order, so the first entries are the oldest.
  const seenAt = new Map<string, number>()

  function evict() {
    const cutoff = now() - ttlMs
    for (const [id, at] of seenAt) {
      if (at > cutoff && seenAt.size < maxEntries) break
      seenAt.delete(id)
    }
  }

  return {
    /** Returns true the first time an id is seen, false for repeats. */
    markSeen(id: string) {
      evict()
      if (seenAt.has(id)) return false
      seenAt.set(id, now())
      return true
    },
  }
}

export type SeenMessages = ReturnType<typeof createSeenMessages>
