import { describe, expect, it } from 'vitest'
import { profileTabHref, resolveProfileTab } from './profile-tab-navigation.js'

describe('resolveProfileTab', () => {
  it('defaults to info when tab is missing or unknown', () => {
    expect(resolveProfileTab(undefined, true)).toBe('info')
    expect(resolveProfileTab(null, true)).toBe('info')
    expect(resolveProfileTab('unknown', true)).toBe('info')
  })

  it('opens billing only when the feature is enabled', () => {
    expect(resolveProfileTab('billing', true)).toBe('billing')
    expect(resolveProfileTab('billing', false)).toBe('info')
  })

  it('accepts other canonical profile tabs', () => {
    expect(resolveProfileTab('sessions', false)).toBe('sessions')
    expect(resolveProfileTab('organizations', false)).toBe('organizations')
  })
})

describe('profileTabHref', () => {
  it('omits query for info and sets tab for others', () => {
    expect(profileTabHref('/user/abc/profile', 'info')).toBe(
      '/user/abc/profile',
    )
    expect(profileTabHref('/user/abc/profile', 'billing')).toBe(
      '/user/abc/profile?tab=billing',
    )
  })
})
