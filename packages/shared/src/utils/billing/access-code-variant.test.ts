import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PLAN_ANNUAL_PRICE_ID,
  DEFAULT_PLAN_MONTHLY_PRICE_ID,
} from './billing-plans.ts'
import {
  buildPlanVariantCatalogFromStripePrices,
  type StripePlanVariantPriceSnapshot,
} from './plan-variant-catalog.ts'
import {
  applyAccessCodeVariant,
  type AccessCodeVariantStore,
} from './access-code-variant.ts'
import type { AdminCustomerBillingSubscriptionRow } from '../admin-customer/admin-customer-billing.ts'

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

const livePaidSubscription: AdminCustomerBillingSubscriptionRow = {
  id: 'sub_1',
  plan: 'default',
  status: 'active',
  trialEnd: null,
  periodEnd: new Date(),
  endedAt: null,
  canceledAt: null,
  stripeSubscriptionId: 'sub_stripe',
  stripeCustomerId: 'cus_1',
}

function createStore(input: {
  subscriptions?: AdminCustomerBillingSubscriptionRow[]
  userExists?: boolean
}): AccessCodeVariantStore & { writes: Array<string | null> } {
  const writes: Array<string | null> = []
  return {
    writes,
    findTargetUser: async () =>
      input.userExists === false ? null : { id: 'user_1' },
    listSubscriptions: async () => input.subscriptions ?? [],
    updateAssignedPlanVariant: async (_userId, variantName) => {
      writes.push(variantName)
    },
  }
}

describe('applyAccessCodeVariant', () => {
  it('applies a complete variant and writes the sparse value', async () => {
    const store = createStore({})
    const outcome = await applyAccessCodeVariant(store, catalog, {
      userId: 'user_1',
      variantName: 'early-bird',
    })

    expect(outcome).toBe('applied')
    expect(store.writes).toEqual(['early-bird'])
  })

  it('sparse-writes null when the variant resolves to basic', async () => {
    const store = createStore({})
    const outcome = await applyAccessCodeVariant(store, catalog, {
      userId: 'user_1',
      variantName: 'basic',
    })

    expect(outcome).toBe('applied')
    expect(store.writes).toEqual([null])
  })

  it('blocks when the user has a live paid Default subscription', async () => {
    const store = createStore({ subscriptions: [livePaidSubscription] })
    const outcome = await applyAccessCodeVariant(store, catalog, {
      userId: 'user_1',
      variantName: 'early-bird',
    })

    expect(outcome).toBe('blocked')
    expect(store.writes).toEqual([])
  })

  it('reports unavailable for an unknown variant name', async () => {
    const store = createStore({})
    const outcome = await applyAccessCodeVariant(store, catalog, {
      userId: 'user_1',
      variantName: 'retired-tier',
    })

    expect(outcome).toBe('unavailable')
    expect(store.writes).toEqual([])
  })

  it('reports unavailable when the target user cannot be found', async () => {
    const store = createStore({ userExists: false })
    const outcome = await applyAccessCodeVariant(store, catalog, {
      userId: 'user_missing',
      variantName: 'early-bird',
    })

    expect(outcome).toBe('unavailable')
    expect(store.writes).toEqual([])
  })
})
