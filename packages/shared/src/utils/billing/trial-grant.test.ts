import { describe, expect, it, vi } from 'vitest'
import { buildEntitlementStanding } from './entitlement-clock.ts'
import { PRO_SUBSCRIPTION_PLAN } from './billing-plans.ts'
import {
  adjustTrialGrantForCustomer,
  clockEndForEntitlementSource,
  convertActiveTrialGrantOnPaidSubscription,
  grantActiveTrialToUser,
  issueTrialGrantToCustomer,
  isPaidStripeSubscriptionForTrialGrantConversion,
  mapAdminCustomerTrialGrantSummary,
  resolveEntitlementFromSources,
  resolveTrialGrantClock,
  revokeTrialGrantForCustomer,
  TrialGrantAlreadyOpenError,
  TrialGrantNotActiveError,
  TrialGrantOpenNotFoundError,
  type TrialGrantClock,
  type TrialGrantStore,
} from './trial-grant.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')
const TRIAL_END = new Date('2026-08-17T12:00:00.000Z')
const EXTENDED_TRIAL_END = new Date('2026-08-24T12:00:00.000Z')
const SUBSCRIPTION_PERIOD_END = new Date('2026-09-10T12:00:00.000Z')

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

  it('is not entitled for revoked grants with no clock dates', () => {
    const standing = resolveTrialGrantClock({
      now: NOW,
      trialGrant: {
        status: 'revoked',
        trialStart: null,
        trialEnd: null,
      },
    })

    expect(standing.entitled).toBe(false)
    expect(standing.remainingMs).toBe(0)
  })
})

describe('mapAdminCustomerTrialGrantSummary', () => {
  it('includes remaining time for an active grant', () => {
    const summary = mapAdminCustomerTrialGrantSummary({
      now: NOW,
      grant: {
        id: 'grant_1',
        userId: 'user_1',
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
        createdAt: new Date('2026-08-01T12:00:00.000Z'),
      },
    })

    expect(summary).toMatchObject({
      status: 'active',
      entitled: true,
      remainingMs: 7 * 24 * 60 * 60 * 1000,
    })
  })
})

describe('resolveEntitlementFromSources', () => {
  it('prefers a live paid Stripe subscription over an active TrialGrant', () => {
    const standing = resolveEntitlementFromSources({
      now: NOW,
      subscriptions: [
        {
          status: 'active',
          plan: PRO_SUBSCRIPTION_PLAN,
          periodEnd: SUBSCRIPTION_PERIOD_END,
        },
      ],
      trialGrant: activeGrant(),
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(SUBSCRIPTION_PERIOD_END)
  })

  it('does not let a canceled Stripe row shadow an active TrialGrant', () => {
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

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(TRIAL_END)
  })

  it('does not let a synced `free` plan row shadow an active TrialGrant', () => {
    const standing = resolveEntitlementFromSources({
      now: NOW,
      subscriptions: [
        {
          status: 'active',
          plan: 'free',
          periodEnd: null,
        },
      ],
      trialGrant: activeGrant(),
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(TRIAL_END)
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

  it('falls back to the Stripe clock once the TrialGrant is no longer live', () => {
    const standing = resolveEntitlementFromSources({
      now: NOW,
      subscriptions: [
        {
          status: 'canceled',
          trialEnd: new Date('2026-07-01T12:00:00.000Z'),
          periodEnd: new Date('2026-08-01T12:00:00.000Z'),
        },
      ],
      trialGrant: { status: 'revoked', trialStart: NOW, trialEnd: TRIAL_END },
    })

    expect(standing.entitled).toBe(false)
    expect(standing.clockEnd).toBeNull()
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
  openGrant?: TrialGrantClock & { id: string; userId: string }
}): TrialGrantStore {
  const grants = new Map<
    string,
    TrialGrantClock & { id: string; userId: string }
  >()
  if (input.openGrant) {
    grants.set(input.openGrant.userId, input.openGrant)
  }

  return {
    findTargetUser: async (userId) =>
      input.user && input.user.id === userId ? input.user : null,
    findOpenTrialGrantByUserId: async (userId) => {
      const row = grants.get(userId)
      if (!row || row.status !== 'active') {
        return null
      }
      return row
    },
    createTrialGrant: vi.fn(async (data) => {
      const row = {
        id: 'grant_1',
        userId: data.userId,
        status: 'active' as const,
        trialStart: data.trialStart,
        trialEnd: data.trialEnd,
      }
      grants.set(data.userId, row)
      return row
    }),
    adjustTrialGrant: vi.fn(async (data) => {
      const existing = grants.get(data.userId)
      if (!existing || existing.status !== 'active') {
        throw new TrialGrantNotActiveError(data.userId)
      }
      const row = {
        ...existing,
        trialEnd: data.trialEnd,
      }
      grants.set(data.userId, row)
      return row
    }),
    revokeTrialGrant: vi.fn(async (data) => {
      const existing = grants.get(data.userId)
      if (!existing) {
        throw new TrialGrantOpenNotFoundError(data.userId)
      }
      const row = {
        ...existing,
        status: 'revoked' as const,
      }
      grants.set(data.userId, row)
      return row
    }),
    convertActiveTrialGrantByUserId: vi.fn(async (userId) => {
      const existing = grants.get(userId)
      if (!existing || existing.status !== 'active') {
        return null
      }
      const row = {
        ...existing,
        status: 'converted' as const,
      }
      grants.set(userId, row)
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
  it('creates an active grant with trialStart and trialEnd, no pending step', () => {
    const store = createTrialGrantStore({
      user: {
        id: 'user_1',
        name: 'Pilot',
        email: 'pilot@example.com',
        role: 'user',
      },
    })

    const result = issueTrialGrantToCustomer(
      store,
      {
        userId: 'user_1',
        actorUserId: 'admin_1',
        reason: 'VR pilot code',
        amount: 7,
        unit: 'days',
      },
      { now: () => NOW },
    )

    return result.then((value) => {
      expect(store.createTrialGrant).toHaveBeenCalledWith({
        userId: 'user_1',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      })
      expect(value).toMatchObject({
        trialGrantId: 'grant_1',
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
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
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    return expect(
      issueTrialGrantToCustomer(store, {
        userId: 'user_1',
        actorUserId: 'admin_1',
        reason: 'Duplicate',
        amount: 7,
        unit: 'days',
      }),
    ).rejects.toBeInstanceOf(TrialGrantAlreadyOpenError)
  })
})

describe('grantActiveTrialToUser', () => {
  it('creates an active grant from a trial day count, unaudited', () => {
    const store = createTrialGrantStore({})

    return grantActiveTrialToUser(
      store,
      { userId: 'user_1', trialDays: 7 },
      { now: () => NOW },
    ).then((result) => {
      expect(store.createTrialGrant).toHaveBeenCalledWith({
        userId: 'user_1',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      })
      expect(store.recordAudit).not.toHaveBeenCalled()
      expect(result).toMatchObject({
        trialGrantId: 'grant_1',
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      })
    })
  })

  it('rejects when the user already has an open grant', () => {
    const store = createTrialGrantStore({
      openGrant: {
        id: 'grant_existing',
        userId: 'user_1',
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    return expect(
      grantActiveTrialToUser(store, { userId: 'user_1', trialDays: 7 }),
    ).rejects.toBeInstanceOf(TrialGrantAlreadyOpenError)
  })
})

describe('adjustTrialGrantForCustomer', () => {
  it('extends trialEnd on an active grant', () => {
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
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    return adjustTrialGrantForCustomer(
      store,
      {
        userId: 'user_1',
        actorUserId: 'admin_1',
        reason: 'Pilot extension',
        amount: 7,
        unit: 'days',
        direction: 'extend',
      },
      { now: () => NOW },
    ).then((result) => {
      expect(store.adjustTrialGrant).toHaveBeenCalledWith({
        userId: 'user_1',
        trialEnd: EXTENDED_TRIAL_END,
      })
      expect(result).toMatchObject({
        trialGrantId: 'grant_1',
        status: 'active',
        previousTrialEnd: TRIAL_END,
        trialEnd: EXTENDED_TRIAL_END,
        auditId: 'audit_1',
      })
    })
  })

  it('reduces trialEnd on an active grant', () => {
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
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    return adjustTrialGrantForCustomer(
      store,
      {
        userId: 'user_1',
        actorUserId: 'admin_1',
        reason: 'Shorten pilot',
        amount: 3,
        unit: 'days',
        direction: 'reduce',
      },
      { now: () => NOW },
    ).then((result) => {
      expect(result.trialEnd).toEqual(new Date('2026-08-14T12:00:00.000Z'))
    })
  })

  it('rejects reducing past the current moment', () => {
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
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    return expect(
      adjustTrialGrantForCustomer(
        store,
        {
          userId: 'user_1',
          actorUserId: 'admin_1',
          reason: 'Too much',
          amount: 10,
          unit: 'days',
          direction: 'reduce',
        },
        { now: () => NOW },
      ),
    ).rejects.toThrow(/would end the Trial Grant in the past/)
  })

  it('rejects adjusting when there is no open grant', () => {
    const store = createTrialGrantStore({
      user: {
        id: 'user_1',
        name: 'Pilot',
        email: 'pilot@example.com',
        role: 'user',
      },
    })

    return expect(
      adjustTrialGrantForCustomer(
        store,
        {
          userId: 'user_1',
          actorUserId: 'admin_1',
          reason: 'Too early',
          amount: 7,
          unit: 'days',
        },
        { now: () => NOW },
      ),
    ).rejects.toBeInstanceOf(TrialGrantNotActiveError)
  })
})

describe('revokeTrialGrantForCustomer', () => {
  it('revokes an open grant and records audit', () => {
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
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    return revokeTrialGrantForCustomer(store, {
      userId: 'user_1',
      actorUserId: 'admin_1',
      reason: 'Code misissued',
    }).then((result) => {
      expect(store.revokeTrialGrant).toHaveBeenCalledWith({
        userId: 'user_1',
      })
      expect(result).toMatchObject({
        trialGrantId: 'grant_1',
        status: 'revoked',
        auditId: 'audit_1',
      })
    })
  })

  it('revokes an active grant and drops entitlement on the next read', async () => {
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
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    await revokeTrialGrantForCustomer(store, {
      userId: 'user_1',
      actorUserId: 'admin_1',
      reason: 'Pilot ended early',
    })

    const standing = resolveTrialGrantClock({
      now: NOW,
      trialGrant: {
        status: 'revoked',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    expect(standing.entitled).toBe(false)
    expect(standing.remainingMs).toBe(0)
  })
})

describe('isPaidStripeSubscriptionForTrialGrantConversion', () => {
  it('accepts a live paid Pro Stripe subscription', () => {
    expect(
      isPaidStripeSubscriptionForTrialGrantConversion({
        plan: PRO_SUBSCRIPTION_PLAN,
        stripeSubscriptionId: 'sub_stripe_1',
      }),
    ).toBe(true)
  })

  it('rejects Free subscriptions and rows without a Stripe subscription id', () => {
    expect(
      isPaidStripeSubscriptionForTrialGrantConversion({
        plan: 'free',
        stripeSubscriptionId: 'sub_stripe_1',
      }),
    ).toBe(false)
    expect(
      isPaidStripeSubscriptionForTrialGrantConversion({
        plan: PRO_SUBSCRIPTION_PLAN,
        stripeSubscriptionId: null,
      }),
    ).toBe(false)
  })
})

describe('convertActiveTrialGrantOnPaidSubscription', () => {
  it('marks an active grant converted when paid checkout creates a Pro subscription', async () => {
    const store = createTrialGrantStore({
      openGrant: {
        id: 'grant_1',
        userId: 'user_1',
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    const result = await convertActiveTrialGrantOnPaidSubscription(store, {
      userId: 'user_1',
      subscription: {
        plan: PRO_SUBSCRIPTION_PLAN,
        stripeSubscriptionId: 'sub_stripe_1',
      },
    })

    expect(result).toEqual({
      converted: true,
      trialGrantId: 'grant_1',
    })
    expect(store.convertActiveTrialGrantByUserId).toHaveBeenCalledWith('user_1')
    await expect(store.findOpenTrialGrantByUserId('user_1')).resolves.toBeNull()
  })

  it('does not convert revoked grants or Free subscriptions', async () => {
    const revokedStore = createTrialGrantStore({
      openGrant: {
        id: 'grant_revoked',
        userId: 'user_1',
        status: 'revoked',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    await expect(
      convertActiveTrialGrantOnPaidSubscription(revokedStore, {
        userId: 'user_1',
        subscription: {
          plan: PRO_SUBSCRIPTION_PLAN,
          stripeSubscriptionId: 'sub_stripe_1',
        },
      }),
    ).resolves.toEqual({ converted: false })

    const activeStore = createTrialGrantStore({
      openGrant: {
        id: 'grant_1',
        userId: 'user_1',
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    await expect(
      convertActiveTrialGrantOnPaidSubscription(activeStore, {
        userId: 'user_1',
        subscription: {
          plan: 'free',
          stripeSubscriptionId: 'sub_free_1',
        },
      }),
    ).resolves.toEqual({ converted: false })
  })

  it('allows issuing a new grant after conversion', async () => {
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
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    await convertActiveTrialGrantOnPaidSubscription(store, {
      userId: 'user_1',
      subscription: {
        plan: PRO_SUBSCRIPTION_PLAN,
        stripeSubscriptionId: 'sub_stripe_1',
      },
    })

    const issued = await issueTrialGrantToCustomer(store, {
      userId: 'user_1',
      actorUserId: 'admin_1',
      reason: 'Second pilot code',
      amount: 7,
      unit: 'days',
    })

    expect(issued).toMatchObject({
      status: 'active',
    })
  })
})

describe('trial grant conversion entitlement handoff', () => {
  it('uses the Stripe clock after checkout converts the grant', async () => {
    const store = createTrialGrantStore({
      openGrant: {
        id: 'grant_1',
        userId: 'user_1',
        status: 'active',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    await convertActiveTrialGrantOnPaidSubscription(store, {
      userId: 'user_1',
      subscription: {
        plan: PRO_SUBSCRIPTION_PLAN,
        stripeSubscriptionId: 'sub_stripe_1',
      },
    })

    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'active',
          plan: PRO_SUBSCRIPTION_PLAN,
          periodEnd: SUBSCRIPTION_PERIOD_END,
        },
      ],
      trialGrant: null,
    })

    expect(standing.entitled).toBe(true)
    expect(standing.canLaunchVr).toBe(true)
    expect(standing.clockEnd).toEqual(SUBSCRIPTION_PERIOD_END)
    expect(standing.clockEnd).not.toEqual(TRIAL_END)
    expect(standing.checkoutCta).toBeNull()
  })
})
