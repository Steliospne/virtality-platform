import { describe, expect, it } from 'vitest'
import {
  decideConsoleSessionGate,
  hasBillingPathEstablished,
} from './console-session-gate.ts'

describe('hasBillingPathEstablished', () => {
  it('is false with no synced Subscription rows', () => {
    expect(hasBillingPathEstablished([])).toBe(false)
  })

  it('is true for any status including expired history', () => {
    expect(hasBillingPathEstablished([{ status: 'canceled' }])).toBe(true)
    expect(hasBillingPathEstablished([{ status: 'active' }])).toBe(true)
  })
})

describe('decideConsoleSessionGate', () => {
  it('allows admin without a Subscription', () => {
    expect(decideConsoleSessionGate({ role: 'admin', subscriptions: [] })).toBe(
      'allow',
    )
  })

  it('allows tester without a Subscription', () => {
    expect(
      decideConsoleSessionGate({ role: 'tester', subscriptions: [] }),
    ).toBe('allow')
  })

  it.each(['active', 'trialing', 'canceled', 'past_due'] as const)(
    'allows when a synced Subscription exists (status %s)',
    (status) => {
      expect(
        decideConsoleSessionGate({
          role: 'user',
          subscriptions: [{ status }],
        }),
      ).toBe('allow')
    },
  )

  it('waitlists when not admin/tester and no synced Subscription', () => {
    expect(decideConsoleSessionGate({ role: 'user', subscriptions: [] })).toBe(
      'waitlist',
    )
  })

  it('waitlists when role is missing and no Subscription (customer alone is not enough)', () => {
    expect(decideConsoleSessionGate({ role: null, subscriptions: [] })).toBe(
      'waitlist',
    )
  })
})
