import { describe, expect, it, vi } from 'vitest'
import {
  AdminCustomerBillingNotFoundError,
  AdminCustomerBillingStateError,
  AdminCustomerBillingValidationError,
  assignFreeAfterCancellationForCustomer,
  buildCancelPaidSubscriptionPreview,
  buildChangePaidPlanPreview,
  cancelPaidSubscriptionForCustomer,
  changePaidPlanForCustomer,
  customerHadPaidBillingHistory,
  findLivePaidProSubscription,
  previewChangePaidPlan,
  reactivatePaidSubscriptionForCustomer,
  sendPaidCheckoutLinkForCustomer,
  type AdminCustomerBillingStore,
  type AdminCustomerBillingStripeGateway,
  type AdminCustomerBillingSubscriptionRow,
} from './admin-customer-billing.ts'
import {
  FREE_PLAN_PRICE_ID,
  PRO_PLAN_ANNUAL_PRICE_ID,
  PRO_PLAN_MONTHLY_PRICE_ID,
  PRO_SUBSCRIPTION_PLAN,
} from './billing-plans.ts'
import type { AdminCustomerBillingSnapshot } from './admin-customer-access.ts'

const ACTOR_ID = 'admin_1'
const SUCCESS_URL = 'https://console.test/profile?checkoutReturn=success'
const CANCEL_URL = 'https://console.test/profile?checkoutReturn=cancel'

function snapshot(
  overrides: Partial<AdminCustomerBillingSnapshot> = {},
): AdminCustomerBillingSnapshot {
  return {
    role: 'user',
    stripeCustomerId: 'cus_1',
    primaryPlan: PRO_SUBSCRIPTION_PLAN,
    primaryStatus: 'active',
    stripeSubscriptionId: 'sub_pro_monthly',
    ...overrides,
  }
}

function subscription(
  overrides: Partial<AdminCustomerBillingSubscriptionRow> = {},
): AdminCustomerBillingSubscriptionRow {
  return {
    id: 'sub_local_1',
    plan: PRO_SUBSCRIPTION_PLAN,
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
    retrievePaidProSubscription: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_pro_monthly',
      stripeCustomerId: 'cus_1',
      subscriptionItemId: 'si_1',
      currentPriceId: PRO_PLAN_MONTHLY_PRICE_ID,
      status: 'active',
      cancelAtPeriodEnd: false,
      periodEnd: new Date('2026-09-10T12:00:00.000Z'),
    })),
    previewPaidPlanChange: vi.fn(async () => ({
      prorationAmountCents: 2500,
      currency: 'eur',
    })),
    schedulePaidPlanPriceAtPeriodEnd: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_pro_monthly',
      stripeScheduleId: 'sub_sched_1',
    })),
    createPaidProSubscription: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_pro_new',
    })),
    cancelSubscriptionImmediately: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_pro_monthly',
    })),
    scheduleCancelAtPeriodEnd: vi.fn(async () => ({
      stripeSubscriptionId: 'sub_pro_monthly',
    })),
    reactivateSubscription: vi.fn(async () => ({
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

describe('findLivePaidProSubscription', () => {
  it('selects the live paid Pro subscription from history', () => {
    expect(
      findLivePaidProSubscription([
        subscription({
          id: 'ended',
          status: 'canceled',
          stripeSubscriptionId: 'sub_old',
        }),
        subscription({ id: 'live', stripeSubscriptionId: 'sub_live' }),
      ])?.stripeSubscriptionId,
    ).toBe('sub_live')
  })
})

describe('customerHadPaidBillingHistory', () => {
  it('detects prior paid billing from ended Pro subscriptions', () => {
    expect(
      customerHadPaidBillingHistory([
        subscription({
          status: 'canceled',
          endedAt: new Date('2026-07-01T12:00:00.000Z'),
        }),
      ]),
    ).toBe(true)
  })
})

describe('previewChangePaidPlan', () => {
  it('returns Checkout fallback preview when the customer has no payment method', async () => {
    const preview = await previewChangePaidPlan(
      createStore({
        user: {
          id: 'user_free',
          name: 'Free User',
          email: 'free@example.com',
          role: 'user',
          stripeCustomerId: 'cus_free',
        },
        subscriptions: [],
      }),
      createGateway({
        customerHasDefaultPaymentMethod: async () => false,
      }),
      {
        userId: 'user_free',
        targetPriceId: PRO_PLAN_MONTHLY_PRICE_ID,
      },
    )

    expect(preview.action).toBe('send_paid_checkout_link')
    expect(preview.effectiveTiming).toBe('on_checkout_completion')
    expect(preview.confirmationMessage).toContain('Checkout link')
  })

  it('schedules paid interval changes at period end without proration', async () => {
    const preview = await previewChangePaidPlan(
      createStore({
        user: {
          id: 'user_paid',
          name: 'Paid User',
          email: 'paid@example.com',
          role: 'user',
          stripeCustomerId: 'cus_1',
        },
        subscriptions: [subscription()],
      }),
      createGateway(),
      {
        userId: 'user_paid',
        targetPriceId: PRO_PLAN_ANNUAL_PRICE_ID,
      },
    )

    expect(preview.action).toBe('change_paid_plan')
    expect(preview.effectiveTiming).toBe('period_end')
    expect(preview.prorationSummary).toBeNull()
    expect(preview.confirmationMessage).toMatch(/period end/)
    expect(
      buildCancelPaidSubscriptionPreview({
        mode: 'immediate',
        periodEnd: null,
      }).requiresConfirmation,
    ).toBe(true)
    expect(
      buildChangePaidPlanPreview({
        targetPriceId: PRO_PLAN_ANNUAL_PRICE_ID,
        periodEnd: new Date('2026-09-10T12:00:00.000Z'),
        prorationAmountCents: null,
        currency: null,
        usesCheckout: false,
        schedulesAtPeriodEnd: true,
      }).confirmationMessage,
    ).toContain('yearly')
  })
})

describe('changePaidPlanForCustomer', () => {
  it('schedules the live paid subscription change at period end', async () => {
    const store = createStore({
      user: {
        id: 'user_paid',
        name: 'Paid User',
        email: 'paid@example.com',
        role: 'user',
        stripeCustomerId: 'cus_1',
      },
      subscriptions: [subscription()],
      billingSnapshots: [
        snapshot(),
        snapshot({ primaryPlan: PRO_SUBSCRIPTION_PLAN }),
      ],
    })
    const gateway = createGateway()

    const result = await changePaidPlanForCustomer(store, gateway, {
      userId: 'user_paid',
      actorUserId: ACTOR_ID,
      reason: 'Requested yearly billing',
      targetPriceId: PRO_PLAN_ANNUAL_PRICE_ID,
      successUrl: SUCCESS_URL,
      cancelUrl: CANCEL_URL,
    })

    expect(gateway.schedulePaidPlanPriceAtPeriodEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeSubscriptionId: 'sub_pro_monthly',
        currentPriceId: PRO_PLAN_MONTHLY_PRICE_ID,
        newPriceId: PRO_PLAN_ANNUAL_PRICE_ID,
      }),
    )
    expect(result.pendingWebhookSync).toBe(true)
    expect(store.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'change_paid_plan',
        outcome: 'pending',
        stripeOperationId: 'sub_sched_1',
      }),
    )
  })

  it('sends a Checkout link when the customer has no payment method', async () => {
    const store = createStore({
      user: {
        id: 'user_free',
        name: 'Free User',
        email: 'free@example.com',
        role: 'user',
        stripeCustomerId: 'cus_free',
      },
      subscriptions: [],
    })
    const gateway = createGateway({
      customerHasDefaultPaymentMethod: async () => false,
    })

    const result = await changePaidPlanForCustomer(store, gateway, {
      userId: 'user_free',
      actorUserId: ACTOR_ID,
      reason: 'Needs paid plan',
      targetPriceId: PRO_PLAN_MONTHLY_PRICE_ID,
      successUrl: SUCCESS_URL,
      cancelUrl: CANCEL_URL,
    })

    expect(gateway.createPaidCheckoutSession).toHaveBeenCalled()
    expect(result.checkoutUrl).toContain('checkout.stripe.test')
    expect(store.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'send_paid_checkout_link',
        stripeOperationId: 'cs_test_1',
      }),
    )
  })
})

describe('cancelPaidSubscriptionForCustomer', () => {
  it('cancels immediately and records a pending audit row', async () => {
    const store = createStore({
      user: {
        id: 'user_paid',
        name: 'Paid User',
        email: 'paid@example.com',
        role: 'user',
        stripeCustomerId: 'cus_1',
      },
      subscriptions: [subscription()],
    })
    const gateway = createGateway()

    const result = await cancelPaidSubscriptionForCustomer(store, gateway, {
      userId: 'user_paid',
      actorUserId: ACTOR_ID,
      reason: 'Requested immediate stop',
      mode: 'immediate',
    })

    expect(gateway.cancelSubscriptionImmediately).toHaveBeenCalledWith(
      'sub_pro_monthly',
    )
    expect(result.pendingWebhookSync).toBe(true)
    expect(store.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'cancel_immediately' }),
    )
  })

  it('rejects cancel-at-period-end when already scheduled', async () => {
    await expect(
      cancelPaidSubscriptionForCustomer(
        createStore({
          user: {
            id: 'user_paid',
            name: 'Paid User',
            email: 'paid@example.com',
            role: 'user',
            stripeCustomerId: 'cus_1',
          },
          subscriptions: [subscription({ cancelAtPeriodEnd: true })],
        }),
        createGateway(),
        {
          userId: 'user_paid',
          actorUserId: ACTOR_ID,
          reason: 'Already scheduled',
          mode: 'period_end',
        },
      ),
    ).rejects.toThrow(AdminCustomerBillingStateError)
  })
})

describe('reactivatePaidSubscriptionForCustomer', () => {
  it('reactivates a subscription scheduled to cancel at period end', async () => {
    const store = createStore({
      user: {
        id: 'user_paid',
        name: 'Paid User',
        email: 'paid@example.com',
        role: 'user',
        stripeCustomerId: 'cus_1',
      },
      subscriptions: [subscription({ cancelAtPeriodEnd: true })],
    })

    const result = await reactivatePaidSubscriptionForCustomer(
      store,
      createGateway(),
      {
        userId: 'user_paid',
        actorUserId: ACTOR_ID,
        reason: 'Customer changed mind',
      },
    )

    expect(result.stripeOperationId).toBe('sub_pro_monthly')
    expect(store.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'reactivate_subscription' }),
    )
  })
})

describe('assignFreeAfterCancellationForCustomer', () => {
  it('cancels live paid Pro and creates permanent Free without a trial', async () => {
    const store = createStore({
      user: {
        id: 'user_paid',
        name: 'Paid User',
        email: 'paid@example.com',
        role: 'user',
        stripeCustomerId: 'cus_1',
      },
      subscriptions: [subscription()],
      billingSnapshots: [
        snapshot(),
        snapshot({
          primaryPlan: 'free',
          primaryStatus: 'active',
          stripeSubscriptionId: 'sub_free_active',
        }),
      ],
    })
    const gateway = createGateway()

    const result = await assignFreeAfterCancellationForCustomer(
      store,
      gateway,
      {
        userId: 'user_paid',
        actorUserId: ACTOR_ID,
        reason: 'Move to restricted Free',
        priceId: FREE_PLAN_PRICE_ID,
      },
    )

    expect(gateway.cancelSubscriptionImmediately).toHaveBeenCalled()
    expect(gateway.createPermanentFreeSubscription).toHaveBeenCalled()
    expect(result.stripeOperationId).toBe('sub_free_active')
    expect(store.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'assign_free_after_cancellation',
      }),
    )
  })
})

describe('sendPaidCheckoutLinkForCustomer', () => {
  it('requires a reason and existing customer', async () => {
    await expect(
      sendPaidCheckoutLinkForCustomer(
        createStore({ user: null }),
        createGateway(),
        {
          userId: 'missing',
          actorUserId: ACTOR_ID,
          reason: 'ab',
          targetPriceId: PRO_PLAN_MONTHLY_PRICE_ID,
          successUrl: SUCCESS_URL,
          cancelUrl: CANCEL_URL,
        },
      ),
    ).rejects.toThrow(AdminCustomerBillingValidationError)

    await expect(
      sendPaidCheckoutLinkForCustomer(
        createStore({ user: null }),
        createGateway(),
        {
          userId: 'missing',
          actorUserId: ACTOR_ID,
          reason: 'Valid reason',
          targetPriceId: PRO_PLAN_MONTHLY_PRICE_ID,
          successUrl: SUCCESS_URL,
          cancelUrl: CANCEL_URL,
        },
      ),
    ).rejects.toThrow(AdminCustomerBillingNotFoundError)
  })
})
