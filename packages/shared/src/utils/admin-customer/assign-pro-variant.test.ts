import { describe, expect, it } from 'vitest'
import {
  PRO_PLAN_ANNUAL_PRICE_ID,
  PRO_PLAN_MONTHLY_PRICE_ID,
} from '../billing/billing-plans.ts'
import {
  ASSIGN_PRO_VARIANT_LIVE_PAID_BLOCK_MESSAGE,
  assignProVariantForCustomer,
  canChangeAssignedProVariant,
  sparseAssignedProVariantWrite,
  type AssignProVariantStore,
} from './assign-pro-variant.ts'
import {
  buildProVariantCatalogFromStripePrices,
  type StripeProVariantPriceSnapshot,
} from '../billing/pro-variant-catalog.ts'
import type { AdminCustomerBillingSnapshot } from './admin-customer-access.ts'
import type { AdminCustomerBillingSubscriptionRow } from './admin-customer-billing.ts'

function price(
  overrides: Partial<StripeProVariantPriceSnapshot> &
    Pick<StripeProVariantPriceSnapshot, 'id' | 'lookup_key'>,
): StripeProVariantPriceSnapshot {
  const interval = overrides.lookup_key?.endsWith('_yearly') ? 'year' : 'month'
  return {
    unit_amount: interval === 'year' ? 150_000 : 15_000,
    currency: 'eur',
    recurring: { interval },
    active: true,
    ...overrides,
  }
}

const catalog = buildProVariantCatalogFromStripePrices([
  price({ id: PRO_PLAN_MONTHLY_PRICE_ID, lookup_key: 'basic_monthly' }),
  price({
    id: PRO_PLAN_ANNUAL_PRICE_ID,
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
    assignedProVariant: 'basic',
    ...overrides,
  }
}

function createStore(input: {
  assignedProVariant?: string | null
  subscriptions?: AdminCustomerBillingSubscriptionRow[]
}): AssignProVariantStore & {
  writes: Array<string | null>
  audits: unknown[]
} {
  let assigned = input.assignedProVariant ?? null
  const writes: Array<string | null> = []
  const audits: unknown[] = []
  return {
    writes,
    audits,
    findTargetUser: async () => ({
      id: 'user_1',
      assignedProVariant: assigned,
    }),
    listSubscriptions: async () => input.subscriptions ?? [],
    summarizeBillingState: async () =>
      snapshot({
        assignedProVariant: assigned == null ? 'basic' : assigned,
      }),
    updateAssignedProVariant: async (_userId, variantName) => {
      assigned = variantName
      writes.push(variantName)
    },
    recordAudit: async (record) => {
      audits.push(record)
      return { id: 'audit_1', record }
    },
  }
}

describe('sparseAssignedProVariantWrite', () => {
  it('stores null for basic and the name otherwise', () => {
    expect(sparseAssignedProVariantWrite('basic')).toBeNull()
    expect(sparseAssignedProVariantWrite('early-bird')).toBe('early-bird')
  })
})

describe('canChangeAssignedProVariant', () => {
  it('blocks live paid Pro seats', () => {
    expect(
      canChangeAssignedProVariant([
        {
          id: 'sub_1',
          plan: 'pro',
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
      canChangeAssignedProVariant([
        {
          id: 'sub_1',
          plan: 'pro',
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
    expect(canChangeAssignedProVariant([])).toBe(true)
  })
})

describe('assignProVariantForCustomer', () => {
  it('assigns early-bird and audits before/after', async () => {
    const store = createStore({})
    const result = await assignProVariantForCustomer(store, catalog, {
      userId: 'user_1',
      actorUserId: 'admin_1',
      reason: 'Early bird campaign',
      variantName: 'early-bird',
    })
    expect(result.assignedProVariant).toBe('early-bird')
    expect(store.writes).toEqual(['early-bird'])
    expect(store.audits).toHaveLength(1)
  })

  it('refuses live paid Pro with the canonical message', async () => {
    const store = createStore({
      subscriptions: [
        {
          id: 'sub_1',
          plan: 'pro',
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
      assignProVariantForCustomer(store, catalog, {
        userId: 'user_1',
        actorUserId: 'admin_1',
        reason: 'Should fail',
        variantName: 'early-bird',
      }),
    ).rejects.toThrow(ASSIGN_PRO_VARIANT_LIVE_PAID_BLOCK_MESSAGE)
  })

  it('rejects incomplete / unknown variants', async () => {
    const store = createStore({})
    await expect(
      assignProVariantForCustomer(store, catalog, {
        userId: 'user_1',
        actorUserId: 'admin_1',
        reason: 'Unknown pair',
        variantName: 'vip',
      }),
    ).rejects.toThrow(/not a complete/)
  })
})
