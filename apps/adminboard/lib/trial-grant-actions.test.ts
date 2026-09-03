import { describe, expect, it } from 'vitest'
import type { AdminCustomerProfile } from '@virtality/shared/utils'
import {
  canAdjustTrialGrant,
  canIssueTrialGrant,
  canRevokeTrialGrant,
} from './trial-grant-actions.ts'

function profile(
  overrides: Partial<AdminCustomerProfile> = {},
): AdminCustomerProfile {
  return {
    role: 'user',
    billingStatus: 'absent',
    subscriptionHistory: [],
    trialGrant: null,
    ...overrides,
  } as AdminCustomerProfile
}

describe('trial grant action eligibility', () => {
  it('allows issuing when no open grant and no live Pro subscription', () => {
    expect(canIssueTrialGrant(profile())).toBe(true)
    expect(
      canIssueTrialGrant(
        profile({
          trialGrant: {
            id: 'grant_1',
            status: 'converted',
            trialStart: null,
            trialEnd: null,
            createdAt: new Date(),
            remainingMs: 0,
            entitled: false,
          },
        }),
      ),
    ).toBe(true)
  })

  it('blocks issuing when a grant is active', () => {
    expect(
      canIssueTrialGrant(
        profile({
          trialGrant: {
            id: 'grant_1',
            status: 'active',
            trialStart: new Date('2026-08-01T12:00:00.000Z'),
            trialEnd: new Date('2026-08-20T12:00:00.000Z'),
            createdAt: new Date(),
            remainingMs: 10 * 24 * 60 * 60 * 1000,
            entitled: true,
          },
        }),
      ),
    ).toBe(false)
  })

  it('exposes adjust and revoke actions for an active grant', () => {
    const active = profile({
      trialGrant: {
        id: 'grant_1',
        status: 'active',
        trialStart: new Date('2026-08-01T12:00:00.000Z'),
        trialEnd: new Date('2026-08-20T12:00:00.000Z'),
        createdAt: new Date(),
        remainingMs: 10 * 24 * 60 * 60 * 1000,
        entitled: true,
      },
    })
    expect(canAdjustTrialGrant(active)).toBe(true)
    expect(canRevokeTrialGrant(active)).toBe(true)

    const converted = profile({
      trialGrant: {
        id: 'grant_1',
        status: 'converted',
        trialStart: new Date('2026-08-01T12:00:00.000Z'),
        trialEnd: new Date('2026-08-20T12:00:00.000Z'),
        createdAt: new Date(),
        remainingMs: 0,
        entitled: false,
      },
    })
    expect(canAdjustTrialGrant(converted)).toBe(false)
    expect(canRevokeTrialGrant(converted)).toBe(false)
  })
})
