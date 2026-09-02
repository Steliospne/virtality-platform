import { describe, expect, it, vi } from 'vitest'
import {
  clockEndForEntitlementSource,
  issueTrialGrantToCustomer,
  resolveEntitlementFromSources,
  resolveTrialGrantClock,
  startTrialGrantForCustomer,
  TrialGrantAlreadyOpenError,
  TrialGrantNotFoundError,
  type TrialGrantClock,
  type TrialGrantStore,
} from './trial-grant.ts'
import { buildEntitlementStanding } from './entitlement-clock.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')
const TRIAL_END = new Date('2026-08-17T12:00:00.000Z')

function activeGrant(
  overrides: Partial<TrialGrantClock> = {},
): TrialGrantClock {
  return {
    status: 'active',
    trialStart: NOW,
    trialEnd: TRIAL_END,
    ...overrides,
  }
}

describe('resolveTrialGrantClock', () => {
  it('is entitled while active and now is before trialEnd', () => {
    const standing = resolveTrialGrantClock({
      now: NOW,
      trialGrant: activeGrant(),
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(TRIAL_END)
    expect(standing.remainingMs).toBe(7 * 24 * 60 * 60 * 1000)
    expect(standing.status).toBe('trialing')
  })

  it('is not entitled once trialEnd passes without mutating stored status', () => {
    const standing = resolveTrialGrantClock({
      now: new Date('2026-08-18T00:00:00.000Z'),
      trialGrant: activeGrant(),
    })

    expect(standing.entitled).toBe(false)
    expect(standing.remainingMs).toBe(0)
    expect(standing.clockEnd).toBeNull()
    expect(standing.status).toBe('active')
  })

  it('is not entitled for pending grants with no clock dates', () => {
    const standing = resolveTrialGrantClock({
      now: NOW,
      trialGrant: {
        status: 'pending',
        trialStart: null,
        trialEnd: null,
      },
    })

    expect(standing.entitled).toBe(false)
    expect(standing.remainingMs).toBe(0)
  })
})

describe('resolveEntitlementFromSources', () => {
  it('prefers Stripe subscription clocks when any subscription exists', () => {
    const standing = resolveEntitlementFromSources({
      now: NOW,
      subscriptions: [
        {
          status: 'canceled',
          trialEnd: new Date('2026-07-01T12:00:00.000Z'),
          periodEnd: new Date('2026-08-01T12:00:00.000Z'),
        },
      ],
      trialGrant: activeGrant(),
    })

    expect(standing.entitled).toBe(false)
    expect(standing.clockEnd).toBeNull()
  })

  it('falls back to TrialGrant when the user has no Stripe subscriptions', () => {
    const standing = resolveEntitlementFromSources({
      now: NOW,
      subscriptions: [],
      trialGrant: activeGrant(),
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(TRIAL_END)
  })
})

describe('buildEntitlementStanding with TrialGrant', () => {
  it('opens the VR gate for an active grant with a future trialEnd', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [],
      trialGrant: activeGrant(),
    })

    expect(standing.entitled).toBe(true)
    expect(standing.canLaunchVr).toBe(true)
    expect(standing.remainingMs).toBeGreaterThan(0)
  })
})

describe('clockEndForEntitlementSource', () => {
  it('reads trialEnd from an active grant when there is no subscription', () => {
    expect(
      clockEndForEntitlementSource({
        subscriptions: [],
        trialGrant: activeGrant(),
      }),
    ).toEqual(TRIAL_END)
  })
})

function createTrialGrantStore(input: {
  user?: { id: string; name: string; email: string; role: string | null }
  openGrant?: TrialGrantClock & { id: string; code: string; userId: string }
}): TrialGrantStore {
  const grants = new Map<
    string,
    TrialGrantClock & { id: string; code: string; userId: string }
  >()
  if (input.openGrant) {
    grants.set(input.openGrant.userId, input.openGrant)
  }

  return {
    findTargetUser: async (userId) =>
      input.user && input.user.id === userId ? input.user : null,
    findOpenTrialGrantByUserId: async (userId) => grants.get(userId) ?? null,
    createTrialGrant: vi.fn(async (data) => {
      const row = {
        id: 'grant_1',
        userId: data.userId,
        code: data.code,
        status: 'pending' as const,
        trialStart: null,
        trialEnd: null,
      }
      grants.set(data.userId, row)
      return row
    }),
    startTrialGrant: vi.fn(async (data) => {
      const existing = grants.get(data.userId)
      if (!existing || existing.status !== 'pending') {
        throw new TrialGrantNotFoundError(data.userId)
      }
      const row = {
        ...existing,
        status: 'active' as const,
        trialStart: data.trialStart,
        trialEnd: data.trialEnd,
      }
      grants.set(data.userId, row)
      return row
    }),
    recordAudit: vi.fn(async (record) => ({ id: 'audit_1', record })),
    summarizeBillingState: vi.fn(async () => ({
      role: 'user',
      stripeCustomerId: null,
      primaryPlan: null,
      primaryStatus: null,
      stripeSubscriptionId: null,
      assignedProVariant: null,
    })),
    userHasLiveProSubscription: vi.fn(async () => false),
  }
}

describe('issueTrialGrantToCustomer', () => {
  it('creates a pending grant without calling Stripe', () => {
    const store = createTrialGrantStore({
      user: {
        id: 'user_1',
        name: 'Pilot',
        email: 'pilot@example.com',
        role: 'user',
      },
    })

    const result = issueTrialGrantToCustomer(store, {
      userId: 'user_1',
      actorUserId: 'admin_1',
      reason: 'VR pilot code',
      code: 'PILOT-001',
    })

    return result.then((value) => {
      expect(store.createTrialGrant).toHaveBeenCalledWith({
        userId: 'user_1',
        code: 'PILOT-001',
      })
      expect(value).toMatchObject({
        trialGrantId: 'grant_1',
        code: 'PILOT-001',
        status: 'pending',
        auditId: 'audit_1',
      })
    })
  })

  it('rejects when the user already has an open grant', () => {
    const store = createTrialGrantStore({
      user: {
        id: 'user_1',
        name: 'Pilot',
        email: 'pilot@example.com',
        role: 'user',
      },
      openGrant: {
        id: 'grant_existing',
        userId: 'user_1',
        code: 'OLD',
        status: 'pending',
        trialStart: null,
        trialEnd: null,
      },
    })

    return expect(
      issueTrialGrantToCustomer(store, {
        userId: 'user_1',
        actorUserId: 'admin_1',
        reason: 'Duplicate',
        code: 'PILOT-002',
      }),
    ).rejects.toBeInstanceOf(TrialGrantAlreadyOpenError)
  })
})

describe('startTrialGrantForCustomer', () => {
  it('activates a pending grant with trialStart and trialEnd', () => {
    const store = createTrialGrantStore({
      user: {
        id: 'user_1',
        name: 'Pilot',
        email: 'pilot@example.com',
        role: 'user',
      },
      openGrant: {
        id: 'grant_1',
        userId: 'user_1',
        code: 'PILOT-001',
        status: 'pending',
        trialStart: null,
        trialEnd: null,
      },
    })

    return startTrialGrantForCustomer(
      store,
      {
        userId: 'user_1',
        actorUserId: 'admin_1',
        reason: 'Onboarding complete',
        amount: 7,
        unit: 'days',
      },
      { now: () => NOW },
    ).then((result) => {
      expect(store.startTrialGrant).toHaveBeenCalledWith({
        userId: 'user_1',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      })
      expect(result).toMatchObject({
        trialGrantId: 'grant_1',
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
        auditId: 'audit_1',
      })
    })
  })
})
