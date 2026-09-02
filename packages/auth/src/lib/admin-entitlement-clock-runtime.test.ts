import { describe, expect, it, vi } from 'vitest'
import {
  createAdminEntitlementClockRuntimeFromPorts,
  type AdminEntitlementClockRearmPort,
  type AdminEntitlementClockRuntimePorts,
} from './admin-entitlement-clock-runtime.ts'
import type {
  AdminCustomerAccessStore,
  AdminCustomerAccessStripeGateway,
  AdminCustomerBillingSnapshot,
  EntitlementExtensionStore,
  EntitlementExtensionStripeGateway,
  LiveSubscriptionRecord,
} from '@virtality/shared/utils'
import {
  FREE_PLAN_PRICE_ID,
  PRO_PLAN_MONTHLY_PRICE_ID,
} from '@virtality/shared/utils'

const NOW = new Date('2026-08-10T12:00:00.000Z')
const ACTOR_ID = 'admin_1'

const USER = {
  id: 'user_1',
  name: 'Seat User',
  email: 'seat@example.com',
  role: 'user',
  stripeCustomerId: 'cus_1',
} as const

function snapshot(
  overrides: Partial<AdminCustomerBillingSnapshot> = {},
): AdminCustomerBillingSnapshot {
  return {
    role: 'user',
    stripeCustomerId: 'cus_1',
    primaryPlan: null,
    primaryStatus: null,
    stripeSubscriptionId: null,
    assignedProVariant: null,
    ...overrides,
  }
}

function createAccessStore(input: {
  user?: typeof USER | null
  billingSnapshots?: AdminCustomerBillingSnapshot[]
}): AdminCustomerAccessStore {
  const user = input.user === undefined ? USER : input.user
  const snapshots = input.billingSnapshots ?? [snapshot()]
  let snapshotIndex = 0

  return {
    findTargetUser: async (userId) =>
      user && user.id === userId ? user : null,
    updateStripeCustomerId: vi.fn(async () => {}),
    updateRoleToUser: vi.fn(async () => {}),
    findLiveSubscriptionByUserId: async () => null,
    summarizeBillingState: async () =>
      snapshots[Math.min(snapshotIndex, snapshots.length - 1)] ?? snapshot(),
    recordAudit: vi.fn(async (record) => {
      snapshotIndex += 1
      return { id: 'audit_access_1', record }
    }),
  }
}

function createAccessStripe(
  overrides: Partial<AdminCustomerAccessStripeGateway> = {},
): AdminCustomerAccessStripeGateway {
  return {
    createCustomer: vi.fn(async () => ({ customerId: 'cus_new' })),
    customerHasEntitledSubscription: vi.fn(async () => false),
    createPermanentFreeSubscription: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_free_active',
    })),
    createTimedTrialSubscription: vi.fn(async (input) => ({
      stripeSubscriptionId: 'sub_free_trial',
      trialEndUnix: input.trialEndUnix,
    })),
    ...overrides,
  }
}

function liveSub(
  overrides: Partial<LiveSubscriptionRecord> = {},
): LiveSubscriptionRecord {
  return {
    id: 'sub_local_1',
    referenceId: USER.id,
    status: 'trialing',
    stripeSubscriptionId: 'sub_stripe_1',
    trialEnd: new Date('2026-08-20T12:00:00.000Z'),
    periodEnd: null,
    ...overrides,
  }
}

function createExtensionStore(input: {
  live?: LiveSubscriptionRecord | null
  customers?: Record<string, string | null>
}): EntitlementExtensionStore {
  const live = input.live ?? null
  const customers = input.customers ?? { [USER.id]: 'cus_1' }
  return {
    findLiveSubscriptionByUserId: async (userId) =>
      live && live.referenceId === userId ? live : null,
    findStripeCustomerIdByUserId: async (userId) =>
      Object.hasOwn(customers, userId) ? customers[userId]! : null,
  }
}

function createExtensionStripe(
  overrides: Partial<EntitlementExtensionStripeGateway> = {},
): EntitlementExtensionStripeGateway {
  return {
    updateTrialEnd: vi.fn(async (input) => ({
      trialEndUnix: input.trialEndUnix,
    })),
    customerHasEntitledSubscription: vi.fn(async () => false),
    createNoCardTrialSubscription: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_new_trial',
    })),
    ...overrides,
  }
}

function createRearm(
  overrides: Partial<AdminEntitlementClockRearmPort> = {},
): AdminEntitlementClockRearmPort {
  return {
    rearmForNewClock: vi.fn(async () => ({ rearranged: true })),
    rearmAfterExtension: vi.fn(async () => ({ rearranged: true })),
    ...overrides,
  }
}

function createRuntime(
  overrides: Partial<AdminEntitlementClockRuntimePorts> = {},
) {
  return createAdminEntitlementClockRuntimeFromPorts({
    accessStore: createAccessStore({}),
    accessStripe: createAccessStripe(),
    extensionStore: createExtensionStore({ live: liveSub() }),
    extensionStripe: createExtensionStripe(),
    rearm: createRearm(),
    freePlanPriceId: FREE_PLAN_PRICE_ID,
    proPlanPriceId: PRO_PLAN_MONTHLY_PRICE_ID,
    now: () => NOW,
    ...overrides,
  })
}

describe('createAdminEntitlementClockRuntimeFromPorts', () => {
  it('assigns permanent Free with the Free price and does not rearm Renew Prompt', async () => {
    const accessStripe = createAccessStripe()
    const rearm = createRearm()
    const runtime = createRuntime({
      accessStore: createAccessStore({
        billingSnapshots: [
          snapshot(),
          snapshot({
            primaryPlan: 'free',
            primaryStatus: 'active',
            stripeSubscriptionId: 'sub_free_active',
          }),
        ],
      }),
      accessStripe,
      rearm,
    })

    const result = await runtime.assignPermanentFree({
      userId: USER.id,
      actorUserId: ACTOR_ID,
      reason: 'Support grant',
    })

    expect(accessStripe.createPermanentFreeSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ priceId: FREE_PLAN_PRICE_ID }),
    )
    expect(result.stripeSubscriptionId).toBe('sub_free_active')
    expect(rearm.rearmForNewClock).not.toHaveBeenCalled()
    expect(rearm.rearmAfterExtension).not.toHaveBeenCalled()
  })

  it('grants a timed trial with the Free price and rearms for the new clock', async () => {
    const accessStripe = createAccessStripe()
    const rearm = createRearm()
    const runtime = createRuntime({
      accessStore: createAccessStore({
        billingSnapshots: [
          snapshot(),
          snapshot({
            primaryPlan: 'free',
            primaryStatus: 'trialing',
            stripeSubscriptionId: 'sub_free_trial',
          }),
        ],
      }),
      accessStripe,
      rearm,
    })

    const result = await runtime.grantTimedTrial({
      userId: USER.id,
      actorUserId: ACTOR_ID,
      reason: 'Pilot access',
      amount: 7,
      unit: 'days',
    })

    expect(accessStripe.createTimedTrialSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ priceId: FREE_PLAN_PRICE_ID }),
    )
    expect(result.trialEnd).toEqual(new Date('2026-08-17T12:00:00.000Z'))
    expect(rearm.rearmForNewClock).toHaveBeenCalledWith({
      userId: USER.id,
      clockEnd: result.trialEnd,
    })
    expect(rearm.rearmAfterExtension).not.toHaveBeenCalled()
  })

  it('extends a live clock with the Pro price and rearms after Extension', async () => {
    const previousTrialEnd = new Date('2026-08-20T12:00:00.000Z')
    const extensionStripe = createExtensionStripe()
    const rearm = createRearm()
    const runtime = createRuntime({
      extensionStore: createExtensionStore({
        live: liveSub({ trialEnd: previousTrialEnd }),
      }),
      extensionStripe,
      rearm,
    })

    const result = await runtime.extendEntitlementClock({
      userId: USER.id,
      actorUserId: ACTOR_ID,
      amount: 7,
      unit: 'days',
    })

    expect(extensionStripe.updateTrialEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeSubscriptionId: 'sub_stripe_1',
      }),
    )
    expect(result.mode).toBe('updated')
    expect(result.trialEnd).toEqual(new Date('2026-08-27T12:00:00.000Z'))
    expect(rearm.rearmAfterExtension).toHaveBeenCalledWith({
      userId: USER.id,
      previousClockEnd: previousTrialEnd,
      nextClockEnd: result.trialEnd,
    })
    expect(rearm.rearmForNewClock).not.toHaveBeenCalled()
  })

  it('reduces a live clock with the Pro price and rearms after Extension', async () => {
    const previousTrialEnd = new Date('2026-08-20T12:00:00.000Z')
    const extensionStripe = createExtensionStripe()
    const rearm = createRearm()
    const runtime = createRuntime({
      extensionStore: createExtensionStore({
        live: liveSub({ trialEnd: previousTrialEnd }),
      }),
      extensionStripe,
      rearm,
    })

    const result = await runtime.extendEntitlementClock({
      userId: USER.id,
      actorUserId: ACTOR_ID,
      amount: 3,
      unit: 'days',
      direction: 'reduce',
    })

    expect(result.mode).toBe('updated')
    expect(result.trialEnd).toEqual(new Date('2026-08-17T12:00:00.000Z'))
    expect(rearm.rearmAfterExtension).toHaveBeenCalledWith({
      userId: USER.id,
      previousClockEnd: previousTrialEnd,
      nextClockEnd: result.trialEnd,
    })
  })
})
