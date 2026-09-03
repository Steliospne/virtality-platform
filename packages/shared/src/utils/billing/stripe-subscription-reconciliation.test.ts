import { describe, expect, it, vi } from 'vitest'
import {
  FREE_SUBSCRIPTION_PLAN,
  DEFAULT_SUBSCRIPTION_PLAN,
} from './billing-plans.ts'
import {
  buildBetterAuthStripePlansFromPlanVariantCatalog,
  buildSandboxPlanVariantCatalog,
} from './plan-variant-catalog.ts'
import {
  reconcileStripeSubscriptions,
  StripeSubscriptionReconciliationError,
  type ReconciliationLogger,
  type ReconciliationStore,
  type ReconciliationStripeGateway,
  type ReconciliationStripeSubscription,
  type ReconciliationSubscriptionRow,
} from './stripe-subscription-reconciliation.ts'

const PLANS = buildBetterAuthStripePlansFromPlanVariantCatalog(
  buildSandboxPlanVariantCatalog(),
)
const DEFAULT_PLAN_PRICE_ID = PLANS.find(
  (plan) => plan.name === DEFAULT_SUBSCRIPTION_PLAN,
)!.priceId

const USER_ID = 'user_1'
const STRIPE_SUB_ID = 'sub_stripe_1'
const CUSTOMER_ID = 'cus_1'

function stripeSub(
  overrides: Partial<ReconciliationStripeSubscription> = {},
): ReconciliationStripeSubscription {
  return {
    id: STRIPE_SUB_ID,
    customer: CUSTOMER_ID,
    status: 'active',
    metadata: { userId: USER_ID, customerType: 'user' },
    items: {
      data: [
        {
          price: {
            id: DEFAULT_PLAN_PRICE_ID,
            lookup_key: 'basic_monthly',
            recurring: { interval: 'month' },
          },
          quantity: 1,
          current_period_start: 1_700_000_000,
          current_period_end: 1_702_592_000,
        },
      ],
    },
    trial_start: null,
    trial_end: null,
    cancel_at_period_end: false,
    cancel_at: null,
    canceled_at: null,
    ended_at: null,
    schedule: null,
    ...overrides,
  }
}

function localRow(
  overrides: Partial<ReconciliationSubscriptionRow> = {},
): ReconciliationSubscriptionRow {
  return {
    id: 'local_sub_1',
    referenceId: USER_ID,
    stripeSubscriptionId: STRIPE_SUB_ID,
    stripeCustomerId: CUSTOMER_ID,
    plan: FREE_SUBSCRIPTION_PLAN,
    status: 'trialing',
    periodStart: new Date('2023-01-01T00:00:00.000Z'),
    periodEnd: new Date('2023-02-01T00:00:00.000Z'),
    cancelAtPeriodEnd: null,
    cancelAt: null,
    canceledAt: null,
    endedAt: null,
    seats: null,
    trialStart: null,
    trialEnd: null,
    billingInterval: null,
    stripeScheduleId: null,
    ...overrides,
  }
}

function createLogger(): ReconciliationLogger & {
  info: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
} {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}

function createStore(
  input: {
    byStripeId?: ReconciliationSubscriptionRow | null
    rows?: ReconciliationSubscriptionRow[]
    userExists?: boolean
  } = {},
): ReconciliationStore & {
  updateStripeDerivedFields: ReturnType<typeof vi.fn>
  createSubscription: ReturnType<typeof vi.fn>
} {
  const rows = input.rows ?? []
  const updateStripeDerivedFields = vi.fn(async () => {})
  const createSubscription = vi.fn(async () => {})

  return {
    findByStripeSubscriptionId: async (stripeSubscriptionId) =>
      input.byStripeId !== undefined
        ? input.byStripeId
        : (rows.find(
            (row) => row.stripeSubscriptionId === stripeSubscriptionId,
          ) ?? null),
    listWithStripeSubscriptionId: async () =>
      rows.filter((row) => row.stripeSubscriptionId != null),
    updateStripeDerivedFields,
    createSubscription,
    userExists: async (userId) => input.userExists ?? userId === USER_ID,
  }
}

function createGateway(input: {
  subscriptions?: ReconciliationStripeSubscription[]
  customerMetadata?: Record<string, string>
}): ReconciliationStripeGateway {
  return {
    listAllSubscriptions: async () => input.subscriptions ?? [],
    retrieveCustomerMetadata: async () => input.customerMetadata ?? {},
  }
}

describe('reconcileStripeSubscriptions', () => {
  it('overwrites Stripe-derived fields for matched user-owned subscriptions', async () => {
    const logger = createLogger()
    const store = createStore({ byStripeId: localRow() })
    const gateway = createGateway({ subscriptions: [stripeSub()] })

    const result = await reconcileStripeSubscriptions({
      gateway,
      store,
      plans: PLANS,
      logger,
      createId: () => 'new_id',
    })

    expect(result).toEqual({
      matched: 1,
      created: 0,
      skipped: 0,
      orphaned: 0,
      drift: [],
    })
    expect(store.updateStripeDerivedFields).toHaveBeenCalledWith(
      'local_sub_1',
      expect.objectContaining({
        status: 'active',
        plan: DEFAULT_SUBSCRIPTION_PLAN,
        billingInterval: 'month',
        periodStart: new Date(1_700_000_000_000),
        periodEnd: new Date(1_702_592_000_000),
      }),
    )
    expect(logger.info).toHaveBeenCalledWith(
      'billing.subscription.reconcile.matched',
      expect.objectContaining({
        stripeSubscriptionId: STRIPE_SUB_ID,
        subscriptionId: 'local_sub_1',
        userId: USER_ID,
      }),
    )
  })

  it('creates a missing local row when metadata.userId resolves to a user', async () => {
    const logger = createLogger()
    const store = createStore({ byStripeId: null })
    const gateway = createGateway({ subscriptions: [stripeSub()] })

    const result = await reconcileStripeSubscriptions({
      gateway,
      store,
      plans: PLANS,
      logger,
      createId: () => 'created_sub_1',
    })

    expect(result).toEqual({
      matched: 0,
      created: 1,
      skipped: 0,
      orphaned: 0,
      drift: [
        {
          kind: 'created',
          stripeSubscriptionId: STRIPE_SUB_ID,
          subscriptionId: 'created_sub_1',
          userId: USER_ID,
        },
      ],
    })
    expect(store.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'created_sub_1',
        referenceId: USER_ID,
        stripeSubscriptionId: STRIPE_SUB_ID,
        stripeCustomerId: CUSTOMER_ID,
        plan: DEFAULT_SUBSCRIPTION_PLAN,
        status: 'active',
      }),
    )
    expect(logger.info).toHaveBeenCalledWith(
      'billing.subscription.reconcile.created',
      expect.objectContaining({
        stripeSubscriptionId: STRIPE_SUB_ID,
        subscriptionId: 'created_sub_1',
        userId: USER_ID,
      }),
    )
  })

  it('skips Stripe subscriptions with unresolvable user ownership', async () => {
    const logger = createLogger()
    const store = createStore({ userExists: false })
    const gateway = createGateway({
      subscriptions: [
        stripeSub({
          metadata: { userId: 'missing_user', customerType: 'user' },
        }),
      ],
    })

    const result = await reconcileStripeSubscriptions({
      gateway,
      store,
      plans: PLANS,
      logger,
      createId: () => 'created_sub_1',
    })

    expect(result).toEqual({
      matched: 0,
      created: 0,
      skipped: 1,
      orphaned: 0,
      drift: [
        {
          kind: 'unresolvable_user',
          stripeSubscriptionId: STRIPE_SUB_ID,
        },
      ],
    })
    expect(store.createSubscription).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(
      'billing.subscription.reconcile.skipped',
      expect.objectContaining({
        stripeSubscriptionId: STRIPE_SUB_ID,
        reason: 'unresolvable_user',
      }),
    )
  })

  it('skips organization-owned Stripe subscriptions', async () => {
    const logger = createLogger()
    const store = createStore()
    const gateway = createGateway({
      subscriptions: [
        stripeSub({
          metadata: {
            customerType: 'organization',
            organizationId: 'org_1',
          },
        }),
      ],
    })

    const result = await reconcileStripeSubscriptions({
      gateway,
      store,
      plans: PLANS,
      logger,
      createId: () => 'created_sub_1',
    })

    expect(result.skipped).toBe(1)
    expect(logger.warn).toHaveBeenCalledWith(
      'billing.subscription.reconcile.skipped',
      expect.objectContaining({
        reason: 'organization_owned',
      }),
    )
  })

  it('logs orphaned local rows when Stripe no longer has the subscription', async () => {
    const logger = createLogger()
    const orphan = localRow({
      id: 'orphan_sub',
      stripeSubscriptionId: 'sub_missing_in_stripe',
    })
    const store = createStore({ rows: [orphan] })
    const gateway = createGateway({ subscriptions: [] })

    const result = await reconcileStripeSubscriptions({
      gateway,
      store,
      plans: PLANS,
      logger,
      createId: () => 'created_sub_1',
    })

    expect(result).toEqual({
      matched: 0,
      created: 0,
      skipped: 0,
      orphaned: 1,
      drift: [
        {
          kind: 'orphaned',
          subscriptionId: 'orphan_sub',
          stripeSubscriptionId: 'sub_missing_in_stripe',
          userId: USER_ID,
        },
      ],
    })
    expect(store.updateStripeDerivedFields).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(
      'billing.subscription.reconcile.orphaned',
      expect.objectContaining({
        subscriptionId: 'orphan_sub',
        stripeSubscriptionId: 'sub_missing_in_stripe',
        userId: USER_ID,
      }),
    )
  })

  it('logs and rethrows when Stripe pagination fails', async () => {
    const logger = createLogger()
    const store = createStore()
    const gateway: ReconciliationStripeGateway = {
      listAllSubscriptions: async () => {
        throw new Error('stripe unavailable')
      },
      retrieveCustomerMetadata: async () => ({}),
    }

    await expect(
      reconcileStripeSubscriptions({
        gateway,
        store,
        plans: PLANS,
        logger,
        createId: () => 'created_sub_1',
      }),
    ).rejects.toBeInstanceOf(StripeSubscriptionReconciliationError)

    expect(logger.error).toHaveBeenCalledWith(
      'billing.subscription.reconcile.failed',
      expect.objectContaining({
        errorMessage: 'stripe unavailable',
        stage: 'list_subscriptions',
      }),
      'Stripe subscription reconciliation failed',
    )
  })
})
