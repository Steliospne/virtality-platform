import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BILLING_CATALOG_SANDBOX,
  DEFAULT_BILLING_CATALOG_SANDBOX_YEARLY_SAVINGS_LABEL,
  buildBillingCatalogFromMinor,
  buildBillingCatalogFromStripePrices,
  buildBillingPlanPriceLabels,
  readYearlySavingsLabelFromPriceMetadata,
} from './billing-catalog.ts'

describe('buildBillingPlanPriceLabels', () => {
  it('formats monthly and yearly list labels from minor units', () => {
    expect(
      buildBillingPlanPriceLabels(
        DEFAULT_BILLING_CATALOG_SANDBOX,
        DEFAULT_BILLING_CATALOG_SANDBOX_YEARLY_SAVINGS_LABEL,
      ),
    ).toEqual({
      monthlyLabel: '€150 / month',
      yearlyAsMonthlyLabel: '€125 / month',
      yearlyTotalMutedLabel: '€1500 / year',
      yearlySavingsLabel: 'Save ~2 months',
    })
  })
})

describe('readYearlySavingsLabelFromPriceMetadata', () => {
  it('reads yearlySavingsLabel from yearly Price metadata', () => {
    expect(
      readYearlySavingsLabelFromPriceMetadata({
        role: 'canonical_pro_yearly',
        yearlySavingsLabel: 'Save ~2 months',
      }),
    ).toBe('Save ~2 months')
  })

  it('returns null when metadata is missing or empty', () => {
    expect(readYearlySavingsLabelFromPriceMetadata(null)).toBeNull()
    expect(readYearlySavingsLabelFromPriceMetadata({})).toBeNull()
    expect(
      readYearlySavingsLabelFromPriceMetadata({ yearlySavingsLabel: '  ' }),
    ).toBeNull()
  })
})

describe('buildBillingCatalogFromStripePrices', () => {
  it('accepts canonical pro monthly and yearly Stripe Prices', () => {
    expect(
      buildBillingCatalogFromStripePrices(
        {
          unit_amount: 15_000,
          currency: 'eur',
          recurring: { interval: 'month' },
        },
        {
          unit_amount: 150_000,
          currency: 'eur',
          recurring: { interval: 'year' },
          metadata: {
            role: 'canonical_pro_yearly',
            yearlySavingsLabel: 'Save ~2 months',
          },
        },
      ),
    ).toEqual(
      buildBillingCatalogFromMinor(
        DEFAULT_BILLING_CATALOG_SANDBOX,
        DEFAULT_BILLING_CATALOG_SANDBOX_YEARLY_SAVINGS_LABEL,
      ),
    )
  })

  it('rejects mismatched currency or interval', () => {
    expect(
      buildBillingCatalogFromStripePrices(
        {
          unit_amount: 15_000,
          currency: 'usd',
          recurring: { interval: 'month' },
        },
        {
          unit_amount: 150_000,
          currency: 'eur',
          recurring: { interval: 'year' },
        },
      ),
    ).toEqual({ ok: false, reason: 'invalid_price' })
  })
})
