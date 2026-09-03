import { describe, expect, it, vi } from 'vitest'
import { getConsoleUrl } from '@virtality/shared/types'
import {
  createAdminCustomerBillingRuntimeFromPorts,
  type AdminCustomerBillingRuntimePorts,
} from './admin-customer-billing-runtime.ts'
import type {
  AdminCustomerBillingSnapshot,
  AdminCustomerBillingStore,
  AdminCustomerBillingStripeGateway,
  AdminCustomerBillingSubscriptionRow,
  AdminCustomerCyclePlanPort,
} from '@virtality/shared/utils'
import {
  FREE_PLAN_PRICE_ID,
  DEFAULT_PLAN_ANNUAL_PRICE_ID,
  DEFAULT_PLAN_MONTHLY_PRICE_ID,
  DEFAULT_SUBSCRIPTION_PLAN,
  withCheckoutReturnIntent,
} from '@virtality/shared/utils'

const ACTOR_ID = 'admin_1'
const PROFILE_RETURN = `${getConsoleUrl().replace(/\/$/, '')}/user/user_paid/profile?tab=billing`
const CYCLE_PLAN_SUCCESS_URL = withCheckoutReturnIntent(
  PROFILE_RETURN,
  'success',
)
const CYCLE_PLAN_CANCEL_URL = withCheckoutReturnIntent(PROFILE_RETURN, 'cancel')

const PAID_USER = {
  id: 'user_paid',
  name: 'Paid User',
  email: 'paid@example.com',
  role: 'user',
  stripeCustomerId: 'cus_1',
} as const

function snapshot(
  overrides: Partial<AdminCustomerBillingSnapshot> = {},
): AdminCustomerBillingSnapshot {
  return {
    role: 'user',
    stripeCustomerId: 'cus_1',
    primaryPlan: DEFAULT_SUBSCRIPTION_PLAN,
    primaryStatus: 'active',
    stripeSubscriptionId: 'sub_pro_monthly',
    assignedDefaultVariant: null,
    ...overrides,
  }
}

function subscription(
  overrides: Partial<AdminCustomerBillingSubscriptionRow> = {},
): AdminCustomerBillingSubscriptionRow {
  return {
    id: 'sub_local_1',
    plan: DEFAULT_SUBSCRIPTION_PLAN,
    status: 'active',
    trialEnd: null,
    periodEnd: new Date('2026-09-10T12:00:00.000Z'),
    endedAt: null,
    canceledAt: null,
    stripeSubscriptionId: 'sub_pro_monthly',
    stripeCustomerId: 'cus_1',
    billingInterval: 'month',
    periodStart: new Date('2026-08-10T12:00:00.000Z'),
    cancelAtPeriodEnd: false,
    stripeScheduleId: null,
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
  subscriptions?: AdminCustomerBillingSubscriptionRow[]
  billingSnapshots?: AdminCustomerBillingSnapshot[]
}): AdminCustomerBillingStore {
  const user = input.user
  const subscriptions = input.subscriptions ?? []
  const snapshots = input.billingSnapshots ?? [snapshot()]
  let snapshotIndex = 0

  return {
    findTargetUser: async (userId) =>
      user && user.id === userId ? user : null,
    updateStripeCustomerId: vi.fn(async () => {}),
    listSubscriptions: async (userId) =>
      user && user.id === userId ? subscriptions : [],
    summarizeBillingState: async () =>
      snapshots[Math.min(snapshotIndex, snapshots.length - 1)] ?? snapshot(),
    recordAudit: vi.fn(async (record) => {
      snapshotIndex += 1
      return { id: 'audit_billing_1', record }
    }),
  }
}

function createGateway(
  overrides: Partial<AdminCustomerBillingStripeGateway> = {},
): AdminCustomerBillingStripeGateway {
  return {
    createCustomer: vi.fn(async () => ({ customerId: 'cus_new' })),
    customerHasDefaultPaymentMethod: vi.fn(async () => true),
    retrievePaidDefaultSubscription: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_pro_monthly',
      stripeCustomerId: 'cus_1',
      subscriptionItemId: 'si_1',
      currentPriceId: DEFAULT_PLAN_MONTHLY_PRICE_ID,
      status: 'active',
      cancelAtPeriodEnd: false,
      periodEnd: new Date('2026-09-10T12:00:00.000Z'),
    })),
    previewPaidPlanChange: vi.fn(async () => ({
      prorationAmountCents: 2500,
      currency: 'eur',
    })),
    createPaidDefaultSubscription: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_pro_new',
    })),
    cancelSubscriptionImmediately: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_pro_monthly',
    })),
    scheduleCancelAtPeriodEnd: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_pro_monthly',
    })),
    createPermanentFreeSubscription: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_free_active',
    })),
    createPaidCheckoutSession: vi.fn(async () => ({
      checkoutSessionId: 'cs_test_1',
      checkoutUrl: 'https://checkout.stripe.test/cs_test_1',
    })),
    ...overrides,
  }
}

function createCyclePlanPort(
  overrides: Partial<AdminCustomerCyclePlanPort> = {},
): AdminCustomerCyclePlanPort {
  return {
    upgrade: vi.fn(async () => ({
      data: {},
      stripeScheduleId: 'sub_sched_1',
    })),
    restore: vi.fn(async () => ({
      data: {},
      stripeSubscriptionId: 'sub_pro_monthly',
    })),
    ...overrides,
  }
}

function createRuntime(
  overrides: Partial<AdminCustomerBillingRuntimePorts> = {},
) {
  return createAdminCustomerBillingRuntimeFromPorts({
    store: createStore({
      user: { ...PAID_USER },
      subscriptions: [subscription()],
    }),
    stripe: createGateway(),
    cyclePlan: createCyclePlanPort(),
    freePlanPriceId: FREE_PLAN_PRICE_ID,
    checkoutReturnUrls: () => ({
      successUrl: CYCLE_PLAN_SUCCESS_URL,
      cancelUrl: CYCLE_PLAN_CANCEL_URL,
    }),
    ...overrides,
  })
}

describe('createAdminCustomerBillingRuntimeFromPorts', () => {
  it('schedules a paid interval change at period end with checkout return URLs', async () => {
    const cyclePlan = createCyclePlanPort()
    const runtime = createRuntime({ cyclePlan })

    const result = await runtime.changePaidPlan({
      userId: PAID_USER.id,
      actorUserId: ACTOR_ID,
      reason: 'Requested yearly billing',
      targetPriceId: DEFAULT_PLAN_ANNUAL_PRICE_ID,
    })

    expect(cyclePlan.upgrade).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'default',
        annual: true,
        referenceId: PAID_USER.id,
        scheduleAtPeriodEnd: true,
        disableRedirect: true,
        returnUrl: CYCLE_PLAN_SUCCESS_URL,
        successUrl: CYCLE_PLAN_SUCCESS_URL,
        cancelUrl: CYCLE_PLAN_CANCEL_URL,
      }),
    )
    expect(result.pendingWebhookSync).toBe(true)
  })

  it('assigns Free after cancellation using the configured Free price', async () => {
    const stripe = createGateway()
    const runtime = createRuntime({
      store: createStore({
        user: { ...PAID_USER },
        subscriptions: [subscription()],
        billingSnapshots: [
          snapshot(),
          snapshot({
            primaryPlan: 'free',
            primaryStatus: 'active',
            stripeSubscriptionId: 'sub_free_active',
          }),
        ],
      }),
      stripe,
    })

    const result = await runtime.assignFreeAfterCancellation({
      userId: PAID_USER.id,
      actorUserId: ACTOR_ID,
      reason: 'Move to restricted Free',
    })

    expect(stripe.createPermanentFreeSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ priceId: FREE_PLAN_PRICE_ID }),
    )
    expect(result.stripeOperationId).toBe('sub_free_active')
    expect(result.pendingWebhookSync).toBe(true)
  })

  it('previews Checkout fallback when the customer has no payment method', async () => {
    const runtime = createRuntime({
      store: createStore({
        user: {
          id: 'user_free',
          name: 'Free User',
          email: 'free@example.com',
          role: 'user',
          stripeCustomerId: 'cus_free',
        },
        subscriptions: [],
      }),
      stripe: createGateway({
        customerHasDefaultPaymentMethod: async () => false,
      }),
    })

    const preview = await runtime.previewChangePaidPlan({
      userId: 'user_free',
      targetPriceId: DEFAULT_PLAN_MONTHLY_PRICE_ID,
    })

    expect(preview.action).toBe('send_paid_checkout_link')
    expect(preview.effectiveTiming).toBe('on_checkout_completion')
  })
})
