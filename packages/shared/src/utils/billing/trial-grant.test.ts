import { describe, expect, it, vi } from 'vitest'
import { buildEntitlementStanding } from './entitlement-clock.ts'
import { DEFAULT_SUBSCRIPTION_PLAN } from './billing-plans.ts'
import {
  ACCESS_GATE_OPEN_STATUSES,
  clockEndForEntitlementSource,
  convertActiveTrialGrantOnPaidSubscription,
  grantActiveTrialToUser,
  issueFreeGrantToUser,
  isPaidStripeSubscriptionForTrialGrantConversion,
  mapAdminCustomerTrialGrantSummary,
  resolveEntitlementFromSources,
  resolveTrialGrantClock,
  TrialGrantAlreadyOpenError,
  type TrialGrantClock,
  type TrialGrantStore,
} from './trial-grant.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')
const TRIAL_END = new Date('2026-08-17T12:00:00.000Z')
const SUBSCRIPTION_PERIOD_END = new Date('2026-09-10T12:00:00.000Z')

function activeGrant(
  overrides: Partial<TrialGrantClock> = {},
): TrialGrantClock {
  return {
    status: 'trialing',
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
    expect(standing.status).toBe('trialing')
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
        status: 'trialing',
        trialStart: NOW,
        trialEnd: TRIAL_END,
        createdAt: new Date('2026-08-01T12:00:00.000Z'),
      },
    })

    expect(summary).toMatchObject({
      status: 'trialing',
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
          plan: DEFAULT_SUBSCRIPTION_PLAN,
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

  it('does not resurrect entitlement from stale Stripe rows when Access Gate is not live', () => {
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

  it('hides Subscribe/Renew and the expired-upgrade prompt while a grant is live, even with a stale expired-looking Stripe subscription row', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'active',
          plan: 'free',
          trialEnd: new Date('2026-07-01T12:00:00.000Z'),
          periodEnd: new Date('2026-07-15T12:00:00.000Z'),
        },
      ],
      trialGrant: activeGrant(),
    })

    expect(standing.entitled).toBe(true)
    expect(standing.checkoutCta).toBeNull()
    expect(standing.expiredFreeUpgradeQualifies).toBe(false)
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

function isOpenAccessGate(status: TrialGrantClock['status']): boolean {
  return (ACCESS_GATE_OPEN_STATUSES as readonly string[]).includes(status)
}

function createTrialGrantStore(input: {
  openGrant?: TrialGrantClock & { id: string; userId: string }
  grants?: Array<TrialGrantClock & { id: string; userId: string }>
}): TrialGrantStore {
  const grantsByUser = new Map<
    string,
    Array<TrialGrantClock & { id: string; userId: string }>
  >()
  const seed = input.grants ?? (input.openGrant ? [input.openGrant] : [])
  for (const grant of seed) {
    const list = grantsByUser.get(grant.userId) ?? []
    list.push(grant)
    grantsByUser.set(grant.userId, list)
  }
  let grantCounter = 0

  const findOpen = (
    userId: string,
    predicate: (row: TrialGrantClock) => boolean,
  ) => {
    const rows = grantsByUser.get(userId) ?? []
    return rows.find(predicate) ?? null
  }

  return {
    findOpenTrialGrantByUserId: async (userId) =>
      findOpen(userId, (row) => isOpenAccessGate(row.status)),
    findOpenTimedAccessGateByUserId: async (userId) =>
      findOpen(userId, (row) => row.status === 'trialing'),
    findOpenGrantedAccessGateByUserId: async (userId) =>
      findOpen(userId, (row) => row.status === 'granted'),
    createTrialGrant: vi.fn(async (data) => {
      grantCounter += 1
      const row = {
        id: `grant_${grantCounter}`,
        userId: data.userId,
        status: data.status,
        trialStart: data.trialStart,
        trialEnd: data.trialEnd,
      }
      const list = grantsByUser.get(data.userId) ?? []
      list.push(row)
      grantsByUser.set(data.userId, list)
      return row
    }),
    convertActiveTrialGrantByUserId: vi.fn(async (userId) => {
      const existing = findOpen(userId, (row) => isOpenAccessGate(row.status))
      if (!existing) {
        return null
      }
      const row = {
        ...existing,
        status: 'converted' as const,
      }
      const list = grantsByUser.get(userId) ?? []
      const index = list.findIndex((item) => item.id === existing.id)
      if (index >= 0) list[index] = row
      return row
    }),
    userHasLiveDefaultSubscription: vi.fn(async () => false),
  }
}

describe('grantActiveTrialToUser', () => {
  it('creates an active grant from a trial day count', () => {
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
        status: 'trialing',
      })
      expect(result).toMatchObject({
        accessGateId: 'grant_1',
        trialGrantId: 'grant_1',
        status: 'trialing',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      })
    })
  })

  it('rejects when the user already has an open timed gate', () => {
    const store = createTrialGrantStore({
      openGrant: {
        id: 'grant_existing',
        userId: 'user_1',
        status: 'trialing',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    return expect(
      grantActiveTrialToUser(store, { userId: 'user_1', trialDays: 7 }),
    ).rejects.toBeInstanceOf(TrialGrantAlreadyOpenError)
  })

  it('allows a timed gate when only a permanent granted gate exists', () => {
    const store = createTrialGrantStore({
      grants: [
        {
          id: 'grant_granted',
          userId: 'user_1',
          status: 'granted',
          trialStart: NOW,
          trialEnd: null,
        },
      ],
    })

    return grantActiveTrialToUser(
      store,
      { userId: 'user_1', trialDays: 7 },
      { now: () => NOW },
    ).then((result) => {
      expect(result).toMatchObject({
        accessGateId: 'grant_1',
        status: 'trialing',
      })
    })
  })
})

describe('issueFreeGrantToUser', () => {
  it('creates a granted Access Gate row with no trial end', () => {
    const store = createTrialGrantStore({})

    return issueFreeGrantToUser(
      store,
      { userId: 'user_1' },
      { now: () => NOW },
    ).then((result) => {
      expect(store.createTrialGrant).toHaveBeenCalledWith({
        userId: 'user_1',
        trialStart: NOW,
        trialEnd: null,
        status: 'granted',
      })
      expect(result).toMatchObject({
        accessGateId: 'grant_1',
        status: 'granted',
        trialEnd: null,
      })
    })
  })
})

describe('isPaidStripeSubscriptionForTrialGrantConversion', () => {
  it('accepts a live paid Default Stripe subscription', () => {
    expect(
      isPaidStripeSubscriptionForTrialGrantConversion({
        plan: DEFAULT_SUBSCRIPTION_PLAN,
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
        plan: DEFAULT_SUBSCRIPTION_PLAN,
        stripeSubscriptionId: null,
      }),
    ).toBe(false)
  })
})

describe('convertActiveTrialGrantOnPaidSubscription', () => {
  it('marks an active grant converted when paid checkout creates a Default subscription', async () => {
    const store = createTrialGrantStore({
      openGrant: {
        id: 'grant_1',
        userId: 'user_1',
        status: 'trialing',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    const result = await convertActiveTrialGrantOnPaidSubscription(store, {
      userId: 'user_1',
      subscription: {
        plan: DEFAULT_SUBSCRIPTION_PLAN,
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
          plan: DEFAULT_SUBSCRIPTION_PLAN,
          stripeSubscriptionId: 'sub_stripe_1',
        },
      }),
    ).resolves.toEqual({ converted: false })

    const activeStore = createTrialGrantStore({
      openGrant: {
        id: 'grant_1',
        userId: 'user_1',
        status: 'trialing',
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
})

describe('trial grant conversion entitlement handoff', () => {
  it('uses the Stripe clock after checkout converts the grant', async () => {
    const store = createTrialGrantStore({
      openGrant: {
        id: 'grant_1',
        userId: 'user_1',
        status: 'trialing',
        trialStart: NOW,
        trialEnd: TRIAL_END,
      },
    })

    await convertActiveTrialGrantOnPaidSubscription(store, {
      userId: 'user_1',
      subscription: {
        plan: DEFAULT_SUBSCRIPTION_PLAN,
        stripeSubscriptionId: 'sub_stripe_1',
      },
    })

    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'active',
          plan: DEFAULT_SUBSCRIPTION_PLAN,
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
