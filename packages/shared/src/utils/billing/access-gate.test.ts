import { describe, expect, it } from 'vitest'
import { DEFAULT_SUBSCRIPTION_PLAN } from './billing-plans.ts'
import {
  accessGateStatusForIssue,
  clockEndForEntitlementSource,
  isOpenGrantedAccessGate,
  isOpenTimedAccessGate,
  resolveAccessGateClock,
  resolveEntitlementFromSources,
  type AccessGateClock,
} from './access-gate.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')
const TRIAL_END = new Date('2026-08-17T12:00:00.000Z')
const SUBSCRIPTION_PERIOD_END = new Date('2026-09-10T12:00:00.000Z')

function trialingGate(
  overrides: Partial<AccessGateClock> = {},
): AccessGateClock {
  return {
    status: 'trialing',
    trialStart: NOW,
    trialEnd: TRIAL_END,
    ...overrides,
  }
}

describe('accessGateStatusForIssue', () => {
  it('uses trialing when a trial end is set', () => {
    expect(accessGateStatusForIssue(TRIAL_END)).toBe('trialing')
  })

  it('uses granted for permanent access with no trial end', () => {
    expect(accessGateStatusForIssue(null)).toBe('granted')
  })
})

describe('open Access Gate status helpers', () => {
  it('identifies open timed and granted gates narrowly', () => {
    expect(isOpenTimedAccessGate(trialingGate())).toBe(true)
    expect(
      isOpenTimedAccessGate({
        status: 'granted',
        trialStart: NOW,
        trialEnd: null,
      }),
    ).toBe(false)
    expect(
      isOpenGrantedAccessGate({
        status: 'granted',
        trialStart: NOW,
        trialEnd: null,
      }),
    ).toBe(true)
    expect(isOpenGrantedAccessGate(trialingGate())).toBe(false)
  })
})

describe('resolveAccessGateClock', () => {
  it('entitles only live trialing clocks', () => {
    const standing = resolveAccessGateClock({
      now: NOW,
      accessGate: trialingGate(),
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(TRIAL_END)
    expect(standing.status).toBe('trialing')
  })

  it('does not entitle lapsed trialing without mutating stored status', () => {
    const standing = resolveAccessGateClock({
      now: new Date('2026-08-18T00:00:00.000Z'),
      accessGate: trialingGate(),
    })

    expect(standing.entitled).toBe(false)
    expect(standing.remainingMs).toBe(0)
    expect(standing.status).toBe('trialing')
  })

  it('does not entitle granted permanent access', () => {
    const standing = resolveAccessGateClock({
      now: NOW,
      accessGate: {
        status: 'granted',
        trialStart: NOW,
        trialEnd: null,
      },
    })

    expect(standing.entitled).toBe(false)
    expect(standing.status).toBe('granted')
  })

  it('does not entitle converted or revoked gates', () => {
    expect(
      resolveAccessGateClock({
        now: NOW,
        accessGate: {
          status: 'converted',
          trialStart: NOW,
          trialEnd: TRIAL_END,
        },
      }).entitled,
    ).toBe(false)

    expect(
      resolveAccessGateClock({
        now: NOW,
        accessGate: {
          status: 'revoked',
          trialStart: null,
          trialEnd: null,
        },
      }).entitled,
    ).toBe(false)
  })
})

describe('resolveEntitlementFromSources', () => {
  it('prefers a live paid Default Stripe subscription over an Access Gate', () => {
    const standing = resolveEntitlementFromSources({
      now: NOW,
      subscriptions: [
        {
          status: 'active',
          plan: DEFAULT_SUBSCRIPTION_PLAN,
          periodEnd: SUBSCRIPTION_PERIOD_END,
        },
      ],
      accessGate: trialingGate(),
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(SUBSCRIPTION_PERIOD_END)
  })

  it('does not fall back to stale Stripe rows once Access Gate standing is not entitled', () => {
    const standing = resolveEntitlementFromSources({
      now: NOW,
      subscriptions: [
        {
          status: 'canceled',
          trialEnd: new Date('2026-07-01T12:00:00.000Z'),
          periodEnd: new Date('2026-08-01T12:00:00.000Z'),
        },
      ],
      accessGate: {
        status: 'revoked',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    expect(standing.entitled).toBe(false)
    expect(standing.clockEnd).toBeNull()
  })

  it('does not let a synced free plan row shadow a live Access Gate', () => {
    const standing = resolveEntitlementFromSources({
      now: NOW,
      subscriptions: [
        {
          status: 'active',
          plan: 'free',
          periodEnd: null,
        },
      ],
      accessGate: trialingGate(),
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(TRIAL_END)
  })

  it('uses Access Gate standing when there is no paid Default subscription', () => {
    const standing = resolveEntitlementFromSources({
      now: NOW,
      subscriptions: [],
      accessGate: trialingGate(),
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(TRIAL_END)
  })
})

describe('clockEndForEntitlementSource', () => {
  it('reads trialEnd from a trialing gate when there is no paid subscription', () => {
    expect(
      clockEndForEntitlementSource({
        subscriptions: [],
        accessGate: trialingGate(),
      }),
    ).toEqual(TRIAL_END)
  })
})
