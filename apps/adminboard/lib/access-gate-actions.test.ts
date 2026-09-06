import { describe, expect, it } from 'vitest'
import type { AdminCustomerProfile } from '@virtality/shared/utils'
import {
  canAssignPermanentAccessGate,
  canRevokeAccessGate,
  canSetAccessGateTrial,
  isAccessGateStaffActionsBlocked,
  setAccessGateTrialActionLabel,
} from './access-gate-actions.ts'

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

describe('access gate action eligibility', () => {
  it('allows staff actions until the Access Gate converts', () => {
    expect(canAssignPermanentAccessGate(profile())).toBe(true)
    expect(canSetAccessGateTrial(profile())).toBe(true)
    expect(
      canAssignPermanentAccessGate(
        profile({
          trialGrant: {
            id: 'gate_1',
            status: 'trialing',
            trialStart: new Date('2026-08-01T12:00:00.000Z'),
            trialEnd: new Date('2026-08-20T12:00:00.000Z'),
            createdAt: new Date(),
            remainingMs: 10 * 24 * 60 * 60 * 1000,
            entitled: true,
          },
        }),
      ),
    ).toBe(true)
  })

  it('blocks all staff actions after conversion', () => {
    const converted = profile({
      trialGrant: {
        id: 'gate_1',
        status: 'converted',
        trialStart: new Date('2026-08-01T12:00:00.000Z'),
        trialEnd: new Date('2026-08-20T12:00:00.000Z'),
        createdAt: new Date(),
        remainingMs: 0,
        entitled: false,
      },
    })

    expect(isAccessGateStaffActionsBlocked(converted)).toBe(true)
    expect(canAssignPermanentAccessGate(converted)).toBe(false)
    expect(canSetAccessGateTrial(converted)).toBe(false)
    expect(canRevokeAccessGate(converted)).toBe(false)
  })

  it('labels trial action based on whether the open gate already has a clock', () => {
    expect(setAccessGateTrialActionLabel(profile())).toBe('Issue trial access')
    expect(
      setAccessGateTrialActionLabel(
        profile({
          trialGrant: {
            id: 'gate_1',
            status: 'trialing',
            trialStart: new Date(),
            trialEnd: new Date('2026-08-20T12:00:00.000Z'),
            createdAt: new Date(),
            remainingMs: 1,
            entitled: true,
          },
        }),
      ),
    ).toBe('Extend trial access')
  })

  it('allows revoke only while an open gate exists', () => {
    expect(canRevokeAccessGate(profile())).toBe(false)
    expect(
      canRevokeAccessGate(
        profile({
          trialGrant: {
            id: 'gate_1',
            status: 'granted',
            trialStart: new Date(),
            trialEnd: null,
            createdAt: new Date(),
            remainingMs: 0,
            entitled: false,
          },
        }),
      ),
    ).toBe(true)
  })
})
