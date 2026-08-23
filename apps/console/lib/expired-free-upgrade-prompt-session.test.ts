import { describe, expect, it } from 'vitest'
import {
  expiredFreeUpgradePromptSessionKey,
  isNewAuthenticatedSession,
  readExpiredFreeUpgradePromptSession,
  recordExpiredFreeUpgradePromptShown,
} from './expired-free-upgrade-prompt-session.js'

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size
    },
  }
}

describe('expiredFreeUpgradePromptSessionKey', () => {
  it('scopes session state per user', () => {
    expect(expiredFreeUpgradePromptSessionKey('user_1')).toBe(
      'virtality:expired-free-upgrade:user_1',
    )
  })
})

describe('readExpiredFreeUpgradePromptSession / recordExpiredFreeUpgradePromptShown', () => {
  it('records last prompt time and seen auth session id', () => {
    const storage = createMemoryStorage()
    const now = new Date('2026-08-10T12:00:00.000Z')

    recordExpiredFreeUpgradePromptShown(storage, 'user_1', {
      now,
      sessionId: 'sess_a',
    })

    expect(readExpiredFreeUpgradePromptSession(storage, 'user_1')).toEqual({
      lastPromptAt: now,
      seenSessionId: 'sess_a',
    })
  })
})

describe('isNewAuthenticatedSession', () => {
  it('is true when the auth session id changes', () => {
    expect(isNewAuthenticatedSession('sess_a', 'sess_b')).toBe(true)
    expect(isNewAuthenticatedSession('sess_a', 'sess_a')).toBe(false)
    expect(isNewAuthenticatedSession(null, 'sess_a')).toBe(true)
  })
})
