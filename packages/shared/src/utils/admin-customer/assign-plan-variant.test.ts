import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PLAN_ANNUAL_PRICE_ID,
  DEFAULT_PLAN_MONTHLY_PRICE_ID,
} from '../billing/billing-plans.ts'
import {
  ASSIGN_PLAN_VARIANT_LIVE_PAID_BLOCK_MESSAGE,
  assignPlanVariantForCustomer,
  canChangeAssignedPlanVariant,
  sparseAssignedPlanVariantWrite,
  type AssignPlanVariantStore,
} from './assign-plan-variant.ts'
import {
  buildPlanVariantCatalogFromStripePrices,
  type StripePlanVariantPriceSnapshot,
} from '../billing/plan-variant-catalog.ts'
import type { AdminCustomerBillingSnapshot } from './admin-customer-access.ts'
import type { AdminCustomerBillingSubscriptionRow } from './admin-customer-billing.ts'

function price(
  overrides: Partial<StripePlanVariantPriceSnapshot> &
    Pick<StripePlanVariantPriceSnapshot, 'id' | 'lookup_key'>,
): StripePlanVariantPriceSnapshot {
  const interval = overrides.lookup_key?.endsWith('_yearly') ? 'year' : 'month'
  return {
    unit_amount: interval === 'year' ? 150_000 : 15_000,
    currency: 'eur',
    recurring: { interval },
    active: true,
    ...overrides,
  }
}

const catalog = buildPlanVariantCatalogFromStripePrices([
  price({ id: DEFAULT_PLAN_MONTHLY_PRICE_ID, lookup_key: 'basic_monthly' }),
  price({
    id: DEFAULT_PLAN_ANNUAL_PRICE_ID,
    lookup_key: 'basic_yearly',
    unit_amount: 150_000,
    recurring: { interval: 'year' },
  }),
  price({
    id: 'price_early_m',
    lookup_key: 'early-bird_monthly',
    unit_amount: 9_900,
  }),
  price({
    id: 'price_early_y',
    lookup_key: 'early-bird_yearly',
    unit_amount: 99_000,
    recurring: { interval: 'year' },
  }),
])

function snapshot(
  overrides: Partial<AdminCustomerBillingSnapshot> = {},
): AdminCustomerBillingSnapshot {
  return {
    role: 'user',
    stripeCustomerId: 'cus_1',
    primaryPlan: null,
    primaryStatus: null,
    stripeSubscriptionId: null,
    assignedDefaultVariant: 'basic',
    ...overrides,
  }
}

function createStore(input: {
  assignedDefaultVariant?: string | null
  subscriptions?: AdminCustomerBillingSubscriptionRow[]
}): AssignPlanVariantStore & {
  writes: Array<string | null>
  audits: unknown[]
} {
  let assigned = input.assignedDefaultVariant ?? null
  const writes: Array<string | null> = []
  const audits: unknown[] = []
  return {
    writes,
    audits,
    findTargetUser: async () => ({
      id: 'user_1',
      assignedDefaultVariant: assigned,
    }),
    listSubscriptions: async () => input.subscriptions ?? [],
    summarizeBillingState: async () =>
      snapshot({
        assignedDefaultVariant: assigned == null ? 'basic' : assigned,
      }),
    updateAssignedPlanVariant: async (_userId, variantName) => {
      assigned = variantName
      writes.push(variantName)
    },
    recordAudit: async (record) => {
      audits.push(record)
      return { id: 'audit_1', record }
    },
  }
}

describe('sparseAssignedPlanVariantWrite', () => {
  it('stores null for basic and the name otherwise', () => {
    expect(sparseAssignedPlanVariantWrite('basic')).toBeNull()
    expect(sparseAssignedPlanVariantWrite('early-bird')).toBe('early-bird')
  })
})

describe('canChangeAssignedPlanVariant', () => {
  it('blocks live paid Default seats', () => {
    expect(
      canChangeAssignedPlanVariant([
        {
          id: 'sub_1',
          plan: 'default',
          status: 'active',
          trialEnd: null,
          periodEnd: new Date(),
          endedAt: null,
          canceledAt: null,
          stripeSubscriptionId: 'sub_stripe',
          stripeCustomerId: 'cus_1',
        },
      ]),
    ).toBe(false)
  })

  it('allows past_due and absent seats', () => {
    expect(
      canChangeAssignedPlanVariant([
        {
          id: 'sub_1',
          plan: 'default',
          status: 'past_due',
          trialEnd: null,
          periodEnd: new Date(),
          endedAt: null,
          canceledAt: null,
          stripeSubscriptionId: 'sub_stripe',
          stripeCustomerId: 'cus_1',
        },
      ]),
    ).toBe(true)
    expect(canChangeAssignedPlanVariant([])).toBe(true)
  })
})

describe('assignPlanVariantForCustomer', () => {
  it('assigns early-bird and audits before/after', async () => {
    const store = createStore({})
    const result = await assignPlanVariantForCustomer(store, catalog, {
      userId: 'user_1',
      actorUserId: 'admin_1',
      reason: 'Early bird campaign',
      variantName: 'early-bird',
    })
    expect(result.assignedDefaultVariant).toBe('early-bird')
    expect(store.writes).toEqual(['early-bird'])
    expect(store.audits).toHaveLength(1)
  })

  it('refuses live paid Default with the canonical message', async () => {
    const store = createStore({
      subscriptions: [
        {
          id: 'sub_1',
          plan: 'default',
          status: 'trialing',
          trialEnd: new Date(),
          periodEnd: new Date(),
          endedAt: null,
          canceledAt: null,
          stripeSubscriptionId: 'sub_stripe',
          stripeCustomerId: 'cus_1',
        },
      ],
    })
    await expect(
      assignPlanVariantForCustomer(store, catalog, {
        userId: 'user_1',
        actorUserId: 'admin_1',
        reason: 'Should fail',
        variantName: 'early-bird',
      }),
    ).rejects.toThrow(ASSIGN_PLAN_VARIANT_LIVE_PAID_BLOCK_MESSAGE)
  })

  it('rejects incomplete / unknown variants', async () => {
    const store = createStore({})
    await expect(
      assignPlanVariantForCustomer(store, catalog, {
        userId: 'user_1',
        actorUserId: 'admin_1',
        reason: 'Unknown pair',
        variantName: 'vip',
      }),
    ).rejects.toThrow(/not a complete/)
  })
})
