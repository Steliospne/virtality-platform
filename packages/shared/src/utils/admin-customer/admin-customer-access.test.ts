import { describe, expect, it, vi } from 'vitest'
import {
  AdminCustomerAccessAlreadyEntitledError,
  AdminCustomerAccessNotFoundError,
  AdminCustomerAccessValidationError,
  assignPermanentFreeToCustomer,
  type AdminCustomerAccessStore,
  type AdminCustomerAccessStripeGateway,
  type AdminCustomerBillingSnapshot,
} from './admin-customer-access.ts'
import { FREE_SUBSCRIPTION_PLAN } from '../billing/billing-plans.ts'
import { buildEntitlementStanding } from '../billing/entitlement-clock.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')
const FREE_PRICE_ID = 'price_free'
const ACTOR_ID = 'admin_1'

function snapshot(
  overrides: Partial<AdminCustomerBillingSnapshot> = {},
): AdminCustomerBillingSnapshot {
  return {
    role: 'user',
    stripeCustomerId: null,
    primaryPlan: null,
    primaryStatus: null,
    stripeSubscriptionId: null,
    assignedProVariant: null,
    ...overrides,
  }
}

function createStore(input: {
  user?: {
    id: string
    name: string
    email: string
    role: string | null
    stripeCustomerId: string | null
  } | null
  liveSubscription?: {
    id: string
    referenceId: string
    status: string
    stripeSubscriptionId: string | null
    trialEnd: Date | null
    periodEnd: Date | null
  } | null
  billingSnapshots?: AdminCustomerBillingSnapshot[]
}): AdminCustomerAccessStore {
  const user = input.user
  const live = input.liveSubscription ?? null
  const snapshots = input.billingSnapshots ?? [snapshot()]
  let snapshotIndex = 0

  return {
    findTargetUser: async (userId) =>
      user && user.id === userId ? user : null,
    updateStripeCustomerId: vi.fn(async () => {}),
    updateRoleToUser: vi.fn(async () => {}),
    findLiveSubscriptionByUserId: async (userId) =>
      live && live.referenceId === userId ? live : null,
    summarizeBillingState: async () =>
      snapshots[Math.min(snapshotIndex, snapshots.length - 1)] ?? snapshot(),
    recordAudit: vi.fn(async (record) => {
      snapshotIndex += 1
      return { id: 'audit_1', record }
    }),
  }
}

function createGateway(
  overrides: Partial<AdminCustomerAccessStripeGateway> = {},
): AdminCustomerAccessStripeGateway {
  return {
    createCustomer: vi.fn(async () => ({ customerId: 'cus_new' })),
    customerHasEntitledSubscription: vi.fn(async () => false),
    createPermanentFreeSubscription: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_free_active',
    })),
    ...overrides,
  }
}

describe('assignPermanentFreeToCustomer', () => {
  it('creates Stripe customer and permanent Free subscription for users without billing', async () => {
    const store = createStore({
      user: {
        id: 'user_none',
        name: 'No Billing',
        email: 'nobilling@example.com',
        role: 'user',
        stripeCustomerId: null,
      },
      billingSnapshots: [
        snapshot({ role: 'user' }),
        snapshot({
          role: 'user',
          stripeCustomerId: 'cus_new',
          primaryPlan: FREE_SUBSCRIPTION_PLAN,
          primaryStatus: 'active',
          stripeSubscriptionId: 'sub_free_active',
        }),
      ],
    })
    const gateway = createGateway()

    const result = await assignPermanentFreeToCustomer(
      store,
      gateway,
      {
        userId: 'user_none',
        actorUserId: ACTOR_ID,
        reason: 'Support grant',
        priceId: FREE_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(store.updateStripeCustomerId).toHaveBeenCalledWith(
      'user_none',
      'cus_new',
    )
    expect(gateway.createPermanentFreeSubscription).toHaveBeenCalled()
    expect(result).toMatchObject({
      stripeCustomerId: 'cus_new',
      stripeSubscriptionId: 'sub_free_active',
      testerDemoted: false,
      auditId: 'audit_1',
    })
    expect(store.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'assign_permanent_free',
        outcome: 'success',
        reason: 'Support grant',
        stripeOperationId: 'sub_free_active',
      }),
    )
  })

  it('demotes tester recipients to user and removes VR bypass after sync', async () => {
    const store = createStore({
      user: {
        id: 'user_tester',
        name: 'Tester',
        email: 'tester@example.com',
        role: 'tester',
        stripeCustomerId: 'cus_tester',
      },
      billingSnapshots: [
        snapshot({ role: 'tester', stripeCustomerId: 'cus_tester' }),
        snapshot({
          role: 'user',
          stripeCustomerId: 'cus_tester',
          primaryPlan: FREE_SUBSCRIPTION_PLAN,
          primaryStatus: 'active',
          stripeSubscriptionId: 'sub_free_active',
        }),
      ],
    })

    const result = await assignPermanentFreeToCustomer(
      store,
      createGateway(),
      {
        userId: 'user_tester',
        actorUserId: ACTOR_ID,
        reason: 'Convert tester to billed free',
        priceId: FREE_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(store.updateRoleToUser).toHaveBeenCalledWith('user_tester')
    expect(result.testerDemoted).toBe(true)

    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          plan: FREE_SUBSCRIPTION_PLAN,
          status: 'active',
          periodEnd: new Date('2026-09-10T12:00:00.000Z'),
        },
      ],
    })
    expect(standing.canLaunchVr).toBe(false)
    expect(standing.entitled).toBe(false)
  })

  it('rejects customers who already have a live entitled subscription', async () => {
    const store = createStore({
      user: {
        id: 'user_live',
        name: 'Live',
        email: 'live@example.com',
        role: 'user',
        stripeCustomerId: 'cus_live',
      },
      liveSubscription: {
        id: 'sub_local',
        referenceId: 'user_live',
        status: 'trialing',
        stripeSubscriptionId: 'sub_live',
        trialEnd: new Date('2026-08-20T12:00:00.000Z'),
        periodEnd: null,
      },
    })
    const gateway = createGateway({
      customerHasEntitledSubscription: async () => true,
    })

    await expect(
      assignPermanentFreeToCustomer(
        store,
        gateway,
        {
          userId: 'user_live',
          actorUserId: ACTOR_ID,
          reason: 'Should fail',
          priceId: FREE_PRICE_ID,
        },
        { now: () => NOW },
      ),
    ).rejects.toThrow(AdminCustomerAccessAlreadyEntitledError)
  })
})
