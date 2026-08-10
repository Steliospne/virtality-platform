import { describe, expect, it, vi } from 'vitest'
import {
  EntitlementExtensionNotLiveError,
  EntitlementExtensionValidationError,
  computeExtensionTrialEnd,
  extendLiveEntitlementClock,
  type EntitlementExtensionStore,
  type EntitlementExtensionStripeGateway,
  type LiveSubscriptionRecord,
} from './entitlement-extension.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')

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

function createStore(
  row: LiveSubscriptionRecord | null,
): EntitlementExtensionStore {
  return {
    findLiveSubscriptionByUserId: async (userId) =>
      row && row.referenceId === userId ? row : null,
  }
}

describe('computeExtensionTrialEnd', () => {
  it('adds days, weeks, and calendar months from now', () => {
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

  it('rejects non-positive amounts and unknown units', () => {
    expect(() => computeExtensionTrialEnd(NOW, 0, 'days')).toThrow(
      EntitlementExtensionValidationError,
    )
    expect(() => computeExtensionTrialEnd(NOW, 1.5, 'days')).toThrow(
      EntitlementExtensionValidationError,
    )
    expect(() => computeExtensionTrialEnd(NOW, 1, 'years' as 'days')).toThrow(
      EntitlementExtensionValidationError,
    )
  })
})

describe('extendLiveEntitlementClock', () => {
  it('pushes trial_end forward for a trialing seat without local writes', async () => {
    const store = createStore(liveSub({ status: 'trialing' }))
    const updateTrialEnd = vi.fn(
      async (input: {
        stripeSubscriptionId: string
        trialEndUnix: number
        metadata: Record<string, string>
      }) => ({ trialEndUnix: input.trialEndUnix }),
    )
    const stripe: EntitlementExtensionStripeGateway = { updateTrialEnd }

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

    const expectedEnd = new Date('2026-08-17T12:00:00.000Z')
    expect(result).toEqual({
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
      },
    })
  })

  it('re-enters trialing for an active seat with the same trial_end update', async () => {
    const store = createStore(
      liveSub({
        status: 'active',
        trialEnd: null,
        periodEnd: new Date('2026-09-10T12:00:00.000Z'),
      }),
    )
    const updateTrialEnd = vi.fn(
      async (input: {
        stripeSubscriptionId: string
        trialEndUnix: number
      }) => ({ trialEndUnix: input.trialEndUnix }),
    )
    const stripe: EntitlementExtensionStripeGateway = { updateTrialEnd }

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
    expect(result.trialEnd).toEqual(new Date('2026-08-24T12:00:00.000Z'))
    expect(updateTrialEnd).toHaveBeenCalledOnce()
  })

  it('rejects seats that are not live trialing or active', async () => {
    const store = createStore(null)
    const updateTrialEnd = vi.fn()
    const stripe: EntitlementExtensionStripeGateway = { updateTrialEnd }

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
    const store = createStore(liveSub())
    const stripe: EntitlementExtensionStripeGateway = {
      updateTrialEnd: async () => {
        throw new Error('stripe down')
      },
    }

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
