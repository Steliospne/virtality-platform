import { describe, expect, it } from 'vitest'
import {
  dismissRenewPrompt,
  isRenewPromptDismissed,
  profileBillingHref,
  renewPromptDismissStorageKey,
} from './renew-prompt-dismiss.js'

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
  }
}

describe('renewPromptDismissStorageKey', () => {
  it('namespaces by user and Entitlement Clock epoch', () => {
    expect(
      renewPromptDismissStorageKey('user_1', '2026-09-12T00:00:00.000Z'),
    ).toBe('virtality:renew-prompt-dismissed:user_1:2026-09-12T00:00:00.000Z')
  })
})

describe('isRenewPromptDismissed / dismissRenewPrompt', () => {
  it('is false until dismissed for that epoch', () => {
    const storage = memoryStorage()

    expect(isRenewPromptDismissed('user_1', 'epoch-a', storage)).toBe(false)

    dismissRenewPrompt('user_1', 'epoch-a', storage)

    expect(isRenewPromptDismissed('user_1', 'epoch-a', storage)).toBe(true)
    expect(isRenewPromptDismissed('user_1', 'epoch-b', storage)).toBe(false)
  })
})

describe('profileBillingHref', () => {
  it('opens the profile Billing tab for the seat holder', () => {
    expect(profileBillingHref('abc')).toBe('/user/abc/profile?tab=billing')
  })
})
