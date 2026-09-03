import { describe, expect, it } from 'vitest'
import { FREE_SUBSCRIPTION_PLAN } from './billing-plans.ts'
import {
  EXPIRED_FREE_UPGRADE_PROMPT_INTERVAL_MS,
  isExpiredFreeSeat,
  resolveExpiredFreeUpgradeQualifies,
  shouldShowExpiredFreeUpgradePrompt,
} from './expired-free-upgrade-prompt.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')

describe('isExpiredFreeSeat', () => {
  it('is true for an active Free subscription after trial expiry', () => {
    expect(
      isExpiredFreeSeat({
        plan: FREE_SUBSCRIPTION_PLAN,
        status: 'active',
      }),
    ).toBe(true)
  })

  it('is false for trialing Free and paid seats', () => {
    expect(
      isExpiredFreeSeat({
        plan: FREE_SUBSCRIPTION_PLAN,
        status: 'trialing',
      }),
    ).toBe(false)
    expect(
      isExpiredFreeSeat({
        plan: 'default',
        status: 'active',
      }),
    ).toBe(false)
  })
})

describe('resolveExpiredFreeUpgradeQualifies', () => {
  it('qualifies expired Free clinicians after trial conversion', () => {
    expect(
      resolveExpiredFreeUpgradeQualifies({
        now: NOW,
        subscriptions: [
          {
            plan: FREE_SUBSCRIPTION_PLAN,
            status: 'active',
            trialEnd: new Date('2026-08-01T12:00:00.000Z'),
            periodEnd: new Date('2026-09-10T12:00:00.000Z'),
          },
        ],
      }),
    ).toBe(true)
  })

  it('does not qualify trialing or paid clinicians', () => {
    expect(
      resolveExpiredFreeUpgradeQualifies({
        now: NOW,
        subscriptions: [
          {
            plan: FREE_SUBSCRIPTION_PLAN,
            status: 'trialing',
            trialEnd: new Date('2026-08-17T12:00:00.000Z'),
          },
        ],
      }),
    ).toBe(false)

    expect(
      resolveExpiredFreeUpgradeQualifies({
        now: NOW,
        subscriptions: [
          {
            plan: 'default',
            status: 'active',
            periodEnd: new Date('2026-09-10T12:00:00.000Z'),
          },
        ],
      }),
    ).toBe(false)
  })

  it('qualifies canceled seats that are no longer entitled', () => {
    expect(
      resolveExpiredFreeUpgradeQualifies({
        now: NOW,
        subscriptions: [
          {
            plan: 'default',
            status: 'canceled',
            periodEnd: new Date('2026-08-01T12:00:00.000Z'),
          },
        ],
      }),
    ).toBe(true)
  })

  it('does not qualify while cancel-at-period-end access remains', () => {
    for (const status of ['active', 'canceled'] as const) {
      expect(
        resolveExpiredFreeUpgradeQualifies({
          now: NOW,
          subscriptions: [
            {
              plan: 'default',
              status,
              periodEnd: new Date('2026-09-10T12:00:00.000Z'),
              cancelAtPeriodEnd: true,
            },
          ],
        }),
      ).toBe(false)
    }
  })

  it('still qualifies after cancel-at-period-end access has ended', () => {
    expect(
      resolveExpiredFreeUpgradeQualifies({
        now: NOW,
        subscriptions: [
          {
            plan: 'default',
            status: 'canceled',
            periodEnd: new Date('2026-08-01T12:00:00.000Z'),
            cancelAtPeriodEnd: true,
          },
        ],
      }),
    ).toBe(true)
  })
})

describe('shouldShowExpiredFreeUpgradePrompt', () => {
  it('shows on each new authenticated login when qualified', () => {
    expect(
      shouldShowExpiredFreeUpgradePrompt({
        qualifies: true,
        now: NOW,
        lastPromptAt: new Date('2026-08-10T11:00:00.000Z'),
        isNewAuthenticatedSession: true,
      }),
    ).toBe(true)
  })

  it('recurs twelve hours after the prior prompt during one session', () => {
    const lastPromptAt = new Date(
      NOW.getTime() - EXPIRED_FREE_UPGRADE_PROMPT_INTERVAL_MS,
    )
    expect(
      shouldShowExpiredFreeUpgradePrompt({
        qualifies: true,
        now: NOW,
        lastPromptAt,
        isNewAuthenticatedSession: false,
      }),
    ).toBe(true)

    expect(
      shouldShowExpiredFreeUpgradePrompt({
        qualifies: true,
        now: new Date(lastPromptAt.getTime() + 60 * 60 * 1000),
        lastPromptAt,
        isNewAuthenticatedSession: false,
      }),
    ).toBe(false)
  })

  it('stays hidden after dismissal until the twelve-hour window elapses', () => {
    const dismissedAt = new Date('2026-08-10T08:00:00.000Z')
    expect(
      shouldShowExpiredFreeUpgradePrompt({
        qualifies: true,
        now: new Date('2026-08-10T10:00:00.000Z'),
        lastPromptAt: dismissedAt,
        isNewAuthenticatedSession: false,
      }),
    ).toBe(false)
  })

  it('suppresses the prompt when paid entitlement is active', () => {
    expect(
      shouldShowExpiredFreeUpgradePrompt({
        qualifies: false,
        now: NOW,
        lastPromptAt: null,
        isNewAuthenticatedSession: true,
      }),
    ).toBe(false)
  })
})
