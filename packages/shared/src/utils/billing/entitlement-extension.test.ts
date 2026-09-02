import { describe, expect, it, vi } from 'vitest'
import {
  EntitlementExtensionAlreadyEntitledError,
  EntitlementExtensionMissingCustomerError,
  EntitlementExtensionNotLiveError,
  EntitlementExtensionValidationError,
  computeExtensionTrialEnd,
  extendEntitlementClock,
  extendLiveEntitlementClock,
  extensionBaseFromLiveClock,
  type EntitlementExtensionStore,
  type EntitlementExtensionStripeGateway,
  type LiveSubscriptionRecord,
} from './entitlement-extension.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')
const PRICE_ID = 'price_canonical_pro'

function liveSub(
  overrides: Partial<LiveSubscriptionRecord> = {},
): LiveSubscriptionRecord {
  return {
    id: 'sub_local_1',
    referenceId: 'user_1',
    status: 'trialing',
    stripeSubscriptionId: 'sub_stripe_1',
    trialEnd: new Date('2026-08-20T12:00:00.000Z'),
    periodEnd: null,
    ...overrides,
  }
}

function createStore(input: {
  live?: LiveSubscriptionRecord | null
  customers?: Record<string, string | null>
}): EntitlementExtensionStore {
  const live = input.live ?? null
  const customers = input.customers ?? {}
  return {
    findLiveSubscriptionByUserId: async (userId) =>
      live && live.referenceId === userId ? live : null,
    findStripeCustomerIdByUserId: async (userId) =>
      Object.hasOwn(customers, userId) ? customers[userId]! : null,
  }
}

function createGateway(
  overrides: Partial<EntitlementExtensionStripeGateway> = {},
): EntitlementExtensionStripeGateway {
  return {
    updateTrialEnd: async (input) => ({ trialEndUnix: input.trialEndUnix }),
    customerHasEntitledSubscription: async () => false,
    createNoCardTrialSubscription: async () => ({
      stripeSubscriptionId: 'sub_new_trial',
    }),
    ...overrides,
  }
}

describe('computeExtensionTrialEnd', () => {
  it('adds days, weeks, and calendar months from the base instant', () => {
    expect(computeExtensionTrialEnd(NOW, 3, 'days')).toEqual(
      new Date('2026-08-13T12:00:00.000Z'),
    )
    expect(computeExtensionTrialEnd(NOW, 2, 'weeks')).toEqual(
      new Date('2026-08-24T12:00:00.000Z'),
    )
    expect(computeExtensionTrialEnd(NOW, 1, 'months')).toEqual(
      new Date('2026-09-10T12:00:00.000Z'),
    )
  })

  it('subtracts days, weeks, and calendar months when direction is reduce', () => {
    expect(computeExtensionTrialEnd(NOW, 3, 'days', 'reduce')).toEqual(
      new Date('2026-08-07T12:00:00.000Z'),
    )
    expect(computeExtensionTrialEnd(NOW, 2, 'weeks', 'reduce')).toEqual(
      new Date('2026-07-27T12:00:00.000Z'),
    )
    expect(computeExtensionTrialEnd(NOW, 1, 'months', 'reduce')).toEqual(
      new Date('2026-07-10T12:00:00.000Z'),
    )
  })

  it('rejects non-positive amounts, unknown units, and unknown directions', () => {
    expect(() => computeExtensionTrialEnd(NOW, 0, 'days')).toThrow(
      EntitlementExtensionValidationError,
    )
    expect(() => computeExtensionTrialEnd(NOW, 1.5, 'days')).toThrow(
      EntitlementExtensionValidationError,
    )
    expect(() => computeExtensionTrialEnd(NOW, 1, 'years' as 'days')).toThrow(
      EntitlementExtensionValidationError,
    )
    expect(() =>
      computeExtensionTrialEnd(NOW, 1, 'days', 'shorten' as 'reduce'),
    ).toThrow(EntitlementExtensionValidationError)
  })
})

describe('extensionBaseFromLiveClock', () => {
  it('uses the future clock end so Extension lengthens Remaining Time', () => {
    expect(
      extensionBaseFromLiveClock(NOW, {
        status: 'trialing',
        trialEnd: new Date('2026-08-20T12:00:00.000Z'),
        periodEnd: null,
      }),
    ).toEqual(new Date('2026-08-20T12:00:00.000Z'))
    expect(
      extensionBaseFromLiveClock(NOW, {
        status: 'active',
        trialEnd: null,
        periodEnd: new Date('2026-09-10T12:00:00.000Z'),
      }),
    ).toEqual(new Date('2026-09-10T12:00:00.000Z'))
  })

  it('falls back to now when the clock end is missing or already past', () => {
    expect(
      extensionBaseFromLiveClock(NOW, {
        status: 'trialing',
        trialEnd: new Date('2026-08-01T12:00:00.000Z'),
        periodEnd: null,
      }),
    ).toEqual(NOW)
    expect(
      extensionBaseFromLiveClock(NOW, {
        status: 'active',
        trialEnd: null,
        periodEnd: null,
      }),
    ).toEqual(NOW)
  })
})

describe('extendLiveEntitlementClock', () => {
  it('adds duration onto the current clock end for a trialing seat', async () => {
    const store = createStore({
      live: liveSub({ status: 'trialing' }),
      customers: { user_1: 'cus_1' },
    })
    const updateTrialEnd = vi.fn(
      async (input: {
        stripeSubscriptionId: string
        trialEndUnix: number
        metadata: Record<string, string>
      }) => ({ trialEndUnix: input.trialEndUnix }),
    )
    const stripe = createGateway({ updateTrialEnd })

    const result = await extendLiveEntitlementClock(
      store,
      stripe,
      {
        userId: 'user_1',
        amount: 7,
        unit: 'days',
        actorUserId: 'admin_9',
      },
      { now: () => NOW },
    )

    // Clock was Aug 20; +7 days → Aug 27 (not now+7 = Aug 17).
    const expectedEnd = new Date('2026-08-27T12:00:00.000Z')
    expect(result).toEqual({
      mode: 'updated',
      stripeSubscriptionId: 'sub_stripe_1',
      previousStatus: 'trialing',
      trialEnd: expectedEnd,
    })
    expect(updateTrialEnd).toHaveBeenCalledWith({
      stripeSubscriptionId: 'sub_stripe_1',
      trialEndUnix: Math.floor(expectedEnd.getTime() / 1000),
      metadata: {
        extensionActorUserId: 'admin_9',
        extensionDurationAmount: '7',
        extensionDurationUnit: 'days',
        extensionDirection: 'extend',
      },
    })
  })

  it('subtracts duration from the current clock end when direction is reduce', async () => {
    const store = createStore({
      live: liveSub({ status: 'trialing' }),
      customers: { user_1: 'cus_1' },
    })
    const updateTrialEnd = vi.fn(
      async (input: {
        stripeSubscriptionId: string
        trialEndUnix: number
        metadata: Record<string, string>
      }) => ({ trialEndUnix: input.trialEndUnix }),
    )
    const stripe = createGateway({ updateTrialEnd })

    const result = await extendLiveEntitlementClock(
      store,
      stripe,
      {
        userId: 'user_1',
        amount: 7,
        unit: 'days',
        direction: 'reduce',
        actorUserId: 'admin_9',
      },
      { now: () => NOW },
    )

    // Clock was Aug 20; -7 days → Aug 13 (not now-7 = Aug 3).
    const expectedEnd = new Date('2026-08-13T12:00:00.000Z')
    expect(result).toEqual({
      mode: 'updated',
      stripeSubscriptionId: 'sub_stripe_1',
      previousStatus: 'trialing',
      trialEnd: expectedEnd,
    })
    expect(updateTrialEnd).toHaveBeenCalledWith({
      stripeSubscriptionId: 'sub_stripe_1',
      trialEndUnix: Math.floor(expectedEnd.getTime() / 1000),
      metadata: {
        extensionActorUserId: 'admin_9',
        extensionDurationAmount: '7',
        extensionDurationUnit: 'days',
        extensionDirection: 'reduce',
      },
    })
  })

  it('rejects a reduction that would end the clock in the past', async () => {
    const store = createStore({
      live: liveSub({ trialEnd: new Date('2026-08-12T12:00:00.000Z') }),
      customers: { user_1: 'cus_1' },
    })
    const updateTrialEnd = vi.fn()
    const stripe = createGateway({ updateTrialEnd })

    await expect(
      extendLiveEntitlementClock(
        store,
        stripe,
        {
          userId: 'user_1',
          amount: 7,
          unit: 'days',
          direction: 'reduce',
          actorUserId: 'admin_9',
        },
        { now: () => NOW },
      ),
    ).rejects.toBeInstanceOf(EntitlementExtensionValidationError)
    expect(updateTrialEnd).not.toHaveBeenCalled()
  })

  it('re-enters trialing for an active seat from periodEnd plus duration', async () => {
    const store = createStore({
      live: liveSub({
        status: 'active',
        trialEnd: null,
        periodEnd: new Date('2026-09-10T12:00:00.000Z'),
      }),
      customers: { user_1: 'cus_1' },
    })
    const updateTrialEnd = vi.fn(
      async (input: {
        stripeSubscriptionId: string
        trialEndUnix: number
      }) => ({ trialEndUnix: input.trialEndUnix }),
    )
    const stripe = createGateway({ updateTrialEnd })

    const result = await extendLiveEntitlementClock(
      store,
      stripe,
      {
        userId: 'user_1',
        amount: 2,
        unit: 'weeks',
        actorUserId: 'admin_9',
      },
      { now: () => NOW },
    )

    expect(result.previousStatus).toBe('active')
    expect(result.mode).toBe('updated')
    // periodEnd Sep 10 + 2 weeks → Sep 24 (not now+2w = Aug 24).
    expect(result.trialEnd).toEqual(new Date('2026-09-24T12:00:00.000Z'))
    expect(updateTrialEnd).toHaveBeenCalledOnce()
  })

  it('rejects seats that are not live trialing or active', async () => {
    const store = createStore({ live: null, customers: {} })
    const updateTrialEnd = vi.fn()
    const stripe = createGateway({ updateTrialEnd })

    await expect(
      extendLiveEntitlementClock(
        store,
        stripe,
        {
          userId: 'user_missing',
          amount: 1,
          unit: 'days',
          actorUserId: 'admin_9',
        },
        { now: () => NOW },
      ),
    ).rejects.toBeInstanceOf(EntitlementExtensionNotLiveError)
    expect(updateTrialEnd).not.toHaveBeenCalled()
  })

  it('surfaces Stripe update failures without claiming success', async () => {
    const store = createStore({
      live: liveSub(),
      customers: { user_1: 'cus_1' },
    })
    const stripe = createGateway({
      updateTrialEnd: async () => {
        throw new Error('stripe down')
      },
    })

    await expect(
      extendLiveEntitlementClock(
        store,
        stripe,
        {
          userId: 'user_1',
          amount: 1,
          unit: 'days',
          actorUserId: 'admin_9',
        },
        { now: () => NOW },
      ),
    ).rejects.toThrow('stripe down')
  })
})

describe('extendEntitlementClock create path', () => {
  it('creates a new no-card Trial Subscription for never-entitled seats', async () => {
    const store = createStore({
      live: null,
      customers: { user_never: 'cus_never' },
    })
    const createNoCardTrialSubscription = vi.fn(
      async (input: {
        customerId: string
        priceId: string
        trialEndUnix: number
        metadata: Record<string, string>
      }) => {
        expect(input).toEqual({
          customerId: 'cus_never',
          priceId: PRICE_ID,
          trialEndUnix: Math.floor(
            new Date('2026-08-17T12:00:00.000Z').getTime() / 1000,
          ),
          metadata: {
            extensionActorUserId: 'admin_9',
            extensionDurationAmount: '7',
            extensionDurationUnit: 'days',
            extensionDirection: 'extend',
          },
        })
        return { stripeSubscriptionId: 'sub_created_1' }
      },
    )
    const updateTrialEnd = vi.fn()
    const stripe = createGateway({
      createNoCardTrialSubscription,
      updateTrialEnd,
    })

    const result = await extendEntitlementClock(
      store,
      stripe,
      {
        userId: 'user_never',
        amount: 7,
        unit: 'days',
        actorUserId: 'admin_9',
        priceId: PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result).toEqual({
      mode: 'created',
      stripeSubscriptionId: 'sub_created_1',
      previousStatus: 'none',
      trialEnd: new Date('2026-08-17T12:00:00.000Z'),
    })
    expect(createNoCardTrialSubscription).toHaveBeenCalledOnce()
    expect(updateTrialEnd).not.toHaveBeenCalled()
  })

  it('creates a new Trial Subscription for canceled seats without resurrecting the old id', async () => {
    const store = createStore({
      live: null,
      customers: { user_canceled: 'cus_canceled' },
    })
    const createNoCardTrialSubscription = vi.fn(async () => ({
      stripeSubscriptionId: 'sub_brand_new',
    }))
    const updateTrialEnd = vi.fn()
    const stripe = createGateway({
      createNoCardTrialSubscription,
      updateTrialEnd,
    })

    const result = await extendEntitlementClock(
      store,
      stripe,
      {
        userId: 'user_canceled',
        amount: 1,
        unit: 'months',
        actorUserId: 'admin_9',
        priceId: PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result.mode).toBe('created')
    expect(result.stripeSubscriptionId).toBe('sub_brand_new')
    expect(result.stripeSubscriptionId).not.toBe('sub_old_canceled')
    expect(updateTrialEnd).not.toHaveBeenCalled()
    expect(createNoCardTrialSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cus_canceled',
        trialEndUnix: Math.floor(
          new Date('2026-09-10T12:00:00.000Z').getTime() / 1000,
        ),
      }),
    )
  })

  it('does not create a second live Subscription when Stripe Customer is already entitled', async () => {
    const store = createStore({
      live: null,
      customers: { user_never: 'cus_race' },
    })
    const createNoCardTrialSubscription = vi.fn()
    const stripe = createGateway({
      customerHasEntitledSubscription: async (customerId) => {
        expect(customerId).toBe('cus_race')
        return true
      },
      createNoCardTrialSubscription,
    })

    await expect(
      extendEntitlementClock(
        store,
        stripe,
        {
          userId: 'user_never',
          amount: 3,
          unit: 'days',
          actorUserId: 'admin_9',
          priceId: PRICE_ID,
        },
        { now: () => NOW },
      ),
    ).rejects.toBeInstanceOf(EntitlementExtensionAlreadyEntitledError)
    expect(createNoCardTrialSubscription).not.toHaveBeenCalled()
  })

  it('rejects create when the user has no Stripe Customer', async () => {
    const store = createStore({ live: null, customers: { user_never: null } })
    const createNoCardTrialSubscription = vi.fn()
    const stripe = createGateway({ createNoCardTrialSubscription })

    await expect(
      extendEntitlementClock(
        store,
        stripe,
        {
          userId: 'user_never',
          amount: 3,
          unit: 'days',
          actorUserId: 'admin_9',
          priceId: PRICE_ID,
        },
        { now: () => NOW },
      ),
    ).rejects.toBeInstanceOf(EntitlementExtensionMissingCustomerError)
    expect(createNoCardTrialSubscription).not.toHaveBeenCalled()
  })

  it('surfaces Stripe create failures without claiming success', async () => {
    const store = createStore({
      live: null,
      customers: { user_never: 'cus_never' },
    })
    const stripe = createGateway({
      createNoCardTrialSubscription: async () => {
        throw new Error('card network down')
      },
    })

    await expect(
      extendEntitlementClock(
        store,
        stripe,
        {
          userId: 'user_never',
          amount: 3,
          unit: 'days',
          actorUserId: 'admin_9',
          priceId: PRICE_ID,
        },
        { now: () => NOW },
      ),
    ).rejects.toThrow('card network down')
  })

  it('rejects reduce when the seat has no live Entitlement Clock to shorten', async () => {
    const store = createStore({
      live: null,
      customers: { user_never: 'cus_never' },
    })
    const createNoCardTrialSubscription = vi.fn()
    const stripe = createGateway({ createNoCardTrialSubscription })

    await expect(
      extendEntitlementClock(
        store,
        stripe,
        {
          userId: 'user_never',
          amount: 7,
          unit: 'days',
          direction: 'reduce',
          actorUserId: 'admin_9',
          priceId: PRICE_ID,
        },
        { now: () => NOW },
      ),
    ).rejects.toBeInstanceOf(EntitlementExtensionValidationError)
    expect(createNoCardTrialSubscription).not.toHaveBeenCalled()
  })

  it('still updates live seats via the unified entry without creating', async () => {
    const store = createStore({
      live: liveSub({ status: 'trialing' }),
      customers: { user_1: 'cus_1' },
    })
    const createNoCardTrialSubscription = vi.fn()
    const updateTrialEnd = vi.fn(async (input: { trialEndUnix: number }) => ({
      trialEndUnix: input.trialEndUnix,
    }))
    const stripe = createGateway({
      createNoCardTrialSubscription,
      updateTrialEnd,
    })

    const result = await extendEntitlementClock(
      store,
      stripe,
      {
        userId: 'user_1',
        amount: 1,
        unit: 'days',
        actorUserId: 'admin_9',
        priceId: PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result.mode).toBe('updated')
    expect(result.trialEnd).toEqual(new Date('2026-08-21T12:00:00.000Z'))
    expect(createNoCardTrialSubscription).not.toHaveBeenCalled()
    expect(updateTrialEnd).toHaveBeenCalledOnce()
  })
})
