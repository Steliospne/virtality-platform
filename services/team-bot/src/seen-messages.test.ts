import { describe, expect, it } from 'vitest'
import { createSeenMessages } from './seen-messages.ts'

describe('createSeenMessages', () => {
  it('reports an id as new once', () => {
    const seen = createSeenMessages()
    expect(seen.markSeen('a')).toBe(true)
    expect(seen.markSeen('a')).toBe(false)
  })

  it('forgets ids after the ttl', () => {
    let now = 0
    const seen = createSeenMessages({ ttlMs: 1000, now: () => now })
    seen.markSeen('a')
    now = 1001
    expect(seen.markSeen('a')).toBe(true)
  })

  it('drops the oldest ids past the size cap', () => {
    const seen = createSeenMessages({ maxEntries: 2 })
    seen.markSeen('a')
    seen.markSeen('b')
    seen.markSeen('c')
    expect(seen.markSeen('c')).toBe(false)
    expect(seen.markSeen('a')).toBe(true)
  })
})
