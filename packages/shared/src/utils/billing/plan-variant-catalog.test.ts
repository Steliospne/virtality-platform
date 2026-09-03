import { describe, expect, it } from 'vitest'
import {
  FREE_PLAN_PRICE_ID,
  FREE_SUBSCRIPTION_PLAN,
  DEFAULT_PLAN_ANNUAL_PRICE_ID,
  DEFAULT_PLAN_MONTHLY_PRICE_ID,
  DEFAULT_SUBSCRIPTION_PLAN,
} from './billing-plans.ts'
import {
  DEFAULT_ASSIGNED_PLAN_VARIANT,
  betterAuthStripePlansMatchPrice,
  buildBetterAuthStripePlansFromPlanVariantCatalog,
  buildBillingCatalogForUser,
  buildPlanVariantCatalogFromStripePrices,
  effectiveAssignedPlanVariant,
  humanizePlanVariantName,
  normalizePlanVariantName,
  parsePlanVariantLookupKey,
  resolvePlanVariantChargePrice,
  resolvePlanVariantPair,
  type StripePlanVariantPriceSnapshot,
} from './plan-variant-catalog.ts'

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

describe('parsePlanVariantLookupKey', () => {
  it('parses name from the right for hyphenated kebab-case', () => {
    expect(parsePlanVariantLookupKey('early-bird_monthly')).toEqual({
      name: 'early-bird',
      interval: 'monthly',
    })
    expect(parsePlanVariantLookupKey('early-bird_yearly')).toEqual({
      name: 'early-bird',
      interval: 'yearly',
    })
  })

  it('aliases legacy pro_* to basic', () => {
    expect(parsePlanVariantLookupKey('pro_monthly')).toEqual({
      name: 'basic',
      interval: 'monthly',
    })
  })

  it('returns null for non-conforming keys', () => {
    expect(parsePlanVariantLookupKey('pro')).toBeNull()
    expect(parsePlanVariantLookupKey('basic_week')).toBeNull()
    expect(parsePlanVariantLookupKey(null)).toBeNull()
  })
})

describe('effectiveAssignedPlanVariant', () => {
  it('reads null as basic', () => {
    expect(effectiveAssignedPlanVariant(null)).toBe(
      DEFAULT_ASSIGNED_PLAN_VARIANT,
    )
    expect(effectiveAssignedPlanVariant(undefined)).toBe(
      DEFAULT_ASSIGNED_PLAN_VARIANT,
    )
    expect(effectiveAssignedPlanVariant('  ')).toBe(
      DEFAULT_ASSIGNED_PLAN_VARIANT,
    )
  })

  it('normalizes legacy pro storage to basic', () => {
    expect(normalizePlanVariantName('pro')).toBe(DEFAULT_ASSIGNED_PLAN_VARIANT)
    expect(effectiveAssignedPlanVariant('pro')).toBe(
      DEFAULT_ASSIGNED_PLAN_VARIANT,
    )
  })
})

describe('buildPlanVariantCatalogFromStripePrices', () => {
  it('groups complete EUR pairs and excludes incomplete', () => {
    const catalog = buildPlanVariantCatalogFromStripePrices([
      price({
        id: DEFAULT_PLAN_MONTHLY_PRICE_ID,
        lookup_key: 'basic_monthly',
      }),
      price({
        id: DEFAULT_PLAN_ANNUAL_PRICE_ID,
        lookup_key: 'basic_yearly',
        unit_amount: 150_000,
        recurring: { interval: 'year' },
        metadata: { yearlySavingsLabel: 'Save ~2 months' },
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
      price({
        id: 'price_orphan',
        lookup_key: 'orphan_monthly',
        unit_amount: 5_000,
      }),
    ])

    expect(catalog.basic?.monthlyPriceId).toBe(DEFAULT_PLAN_MONTHLY_PRICE_ID)
    expect(catalog.variants.map((v) => v.name)).toEqual(['basic', 'early-bird'])
    expect(catalog.variants.find((v) => v.name === 'orphan')).toBeUndefined()
  })

  it('prefers basic_* over legacy pro_* for the same pair', () => {
    const catalog = buildPlanVariantCatalogFromStripePrices([
      price({ id: 'price_old_m', lookup_key: 'pro_monthly' }),
      price({
        id: 'price_old_y',
        lookup_key: 'pro_yearly',
        unit_amount: 150_000,
        recurring: { interval: 'year' },
      }),
      price({
        id: DEFAULT_PLAN_MONTHLY_PRICE_ID,
        lookup_key: 'basic_monthly',
      }),
      price({
        id: DEFAULT_PLAN_ANNUAL_PRICE_ID,
        lookup_key: 'basic_yearly',
        unit_amount: 150_000,
        recurring: { interval: 'year' },
      }),
    ])

    expect(catalog.basic?.monthlyPriceId).toBe(DEFAULT_PLAN_MONTHLY_PRICE_ID)
    expect(catalog.basic?.yearlyPriceId).toBe(DEFAULT_PLAN_ANNUAL_PRICE_ID)
  })

  it('treats legacy pro_* alone as basic', () => {
    const catalog = buildPlanVariantCatalogFromStripePrices([
      price({
        id: DEFAULT_PLAN_MONTHLY_PRICE_ID,
        lookup_key: 'pro_monthly',
      }),
      price({
        id: DEFAULT_PLAN_ANNUAL_PRICE_ID,
        lookup_key: 'pro_yearly',
        unit_amount: 150_000,
        recurring: { interval: 'year' },
      }),
    ])
    expect(catalog.basic?.name).toBe('basic')
  })
})

describe('resolvePlanVariantPair', () => {
  const catalog = buildPlanVariantCatalogFromStripePrices([
    price({
      id: DEFAULT_PLAN_MONTHLY_PRICE_ID,
      lookup_key: 'basic_monthly',
    }),
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

  it('resolves null assignment to basic', () => {
    const result = resolvePlanVariantPair(catalog, null)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.pair.name).toBe('basic')
      expect(result.pair.monthlyPriceId).toBe(DEFAULT_PLAN_MONTHLY_PRICE_ID)
    }
  })

  it('fails closed for unknown variant without falling back to basic', () => {
    expect(resolvePlanVariantPair(catalog, 'vip')).toEqual({
      ok: false,
      reason: 'unknown_variant',
      variantName: 'vip',
    })
  })

  it('resolves charge Price id from annual flag', () => {
    expect(
      resolvePlanVariantChargePrice(catalog, 'early-bird', true),
    ).toMatchObject({
      ok: true,
      priceId: 'price_early_y',
      annual: true,
    })
    expect(
      resolvePlanVariantChargePrice(catalog, 'early-bird', false),
    ).toMatchObject({
      ok: true,
      priceId: 'price_early_m',
      annual: false,
    })
  })
})

describe('buildBillingCatalogForUser', () => {
  const catalog = buildPlanVariantCatalogFromStripePrices([
    price({
      id: DEFAULT_PLAN_MONTHLY_PRICE_ID,
      lookup_key: 'basic_monthly',
    }),
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

  it('omits compare-at for basic seats', () => {
    const read = buildBillingCatalogForUser(catalog, null)
    expect(read.ok).toBe(true)
    if (read.ok) {
      expect(read.showCompareAt).toBe(false)
      expect(read.assigned.minor.monthly).toBe(15_000)
    }
  })

  it('includes basic slice for non-basic compare-at', () => {
    const read = buildBillingCatalogForUser(catalog, 'early-bird')
    expect(read.ok).toBe(true)
    if (read.ok) {
      expect(read.showCompareAt).toBe(true)
      expect(read.assigned.minor.monthly).toBe(9_900)
      expect(read.basic.minor.monthly).toBe(15_000)
    }
  })
})

describe('humanizePlanVariantName', () => {
  it('humanizes kebab-case for Adminboard labels', () => {
    expect(humanizePlanVariantName('early-bird')).toBe('Early Bird')
    expect(humanizePlanVariantName('basic')).toBe('Basic')
  })
})

describe('buildBetterAuthStripePlansFromPlanVariantCatalog', () => {
  const catalog = buildPlanVariantCatalogFromStripePrices([
    price({
      id: DEFAULT_PLAN_MONTHLY_PRICE_ID,
      lookup_key: 'basic_monthly',
    }),
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

  it('registers free and every Assigned Variant Price as plan pro', () => {
    const plans = buildBetterAuthStripePlansFromPlanVariantCatalog(catalog)
    expect(plans[0]).toEqual(
      expect.objectContaining({
        name: FREE_SUBSCRIPTION_PLAN,
        priceId: FREE_PLAN_PRICE_ID,
      }),
    )
    const proPriceIds = plans
      .filter((plan) => plan.name === DEFAULT_SUBSCRIPTION_PLAN)
      .flatMap((plan) => [plan.priceId, plan.annualDiscountPriceId])
    expect(proPriceIds).toEqual(
      expect.arrayContaining([
        DEFAULT_PLAN_MONTHLY_PRICE_ID,
        DEFAULT_PLAN_ANNUAL_PRICE_ID,
        'price_early_m',
        'price_early_y',
      ]),
    )
  })

  it('matches early-bird Checkout Prices so webhook sync can set plan pro', () => {
    const plans = buildBetterAuthStripePlansFromPlanVariantCatalog(catalog)
    expect(
      betterAuthStripePlansMatchPrice(plans, { id: 'price_early_m' })?.name,
    ).toBe(DEFAULT_SUBSCRIPTION_PLAN)
    expect(
      betterAuthStripePlansMatchPrice(plans, {
        id: 'price_other',
        lookup_key: 'early-bird_yearly',
      })?.name,
    ).toBe(DEFAULT_SUBSCRIPTION_PLAN)
  })

  it('keeps getPlanByName(pro) on basic for Checkout plan selection', () => {
    const plans = buildBetterAuthStripePlansFromPlanVariantCatalog(catalog)
    const firstDefault = plans.find(
      (plan) => plan.name === DEFAULT_SUBSCRIPTION_PLAN,
    )
    expect(firstDefault?.priceId).toBe(DEFAULT_PLAN_MONTHLY_PRICE_ID)
    expect(firstDefault?.annualDiscountPriceId).toBe(
      DEFAULT_PLAN_ANNUAL_PRICE_ID,
    )
  })
})
