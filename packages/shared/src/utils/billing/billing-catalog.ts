/**
 * Console Default catalog list prices from Stripe canonical Prices.
 * Display labels and minor units stay derived from the same source for
 * plan cards and Discount rewrite math.
 */

export type BillingCatalogMinor = {
  monthly: number
  yearly: number
}

export type BillingPlanPriceLabels = {
  monthlyLabel: string
  yearlyAsMonthlyLabel: string
  yearlyTotalMutedLabel: string
  yearlySavingsLabel: string | null
}

export type BillingCatalogRead =
  | {
      ok: true
      minor: BillingCatalogMinor
      labels: BillingPlanPriceLabels
    }
  | {
      ok: false
      reason: 'stripe_unavailable' | 'invalid_price'
    }

type StripePriceSnapshot = {
  unit_amount: number | null
  currency: string
  recurring: { interval: string } | null
  metadata?: Record<string, string> | null
}

/** Stripe Price metadata key on the canonical yearly Price. */
export const BILLING_CATALOG_YEARLY_SAVINGS_LABEL_METADATA_KEY =
  'yearlySavingsLabel' as const

/** Sandbox canonical amounts when Stripe is unavailable in development. */
export const DEFAULT_BILLING_CATALOG_SANDBOX: BillingCatalogMinor = {
  monthly: 15_000,
  yearly: 150_000,
} as const

/** Sandbox yearly savings badge copy; mirrors canonical yearly Price metadata. */
export const DEFAULT_BILLING_CATALOG_SANDBOX_YEARLY_SAVINGS_LABEL =
  'Save ~2 months' as const

export function formatEurFromMinor(minor: number): string {
  const major = minor / 100
  if (Number.isInteger(major)) return `€${major}`
  return `€${major.toFixed(2)}`
}

export function readYearlySavingsLabelFromPriceMetadata(
  metadata: Record<string, string> | null | undefined,
): string | null {
  const label = metadata?.[BILLING_CATALOG_YEARLY_SAVINGS_LABEL_METADATA_KEY]
  if (label == null) return null
  const trimmed = label.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function buildBillingPlanPriceLabels(
  minor: BillingCatalogMinor,
  yearlySavingsLabel: string | null = null,
): BillingPlanPriceLabels {
  const yearlyAsMonthlyMinor = Math.round(minor.yearly / 12)
  return {
    monthlyLabel: `${formatEurFromMinor(minor.monthly)} / month`,
    yearlyAsMonthlyLabel: `${formatEurFromMinor(yearlyAsMonthlyMinor)} / month`,
    yearlyTotalMutedLabel: `${formatEurFromMinor(minor.yearly)} / year`,
    yearlySavingsLabel,
  }
}

export function buildBillingCatalogFromMinor(
  minor: BillingCatalogMinor,
  yearlySavingsLabel: string | null = null,
): Extract<BillingCatalogRead, { ok: true }> {
  return {
    ok: true,
    minor,
    labels: buildBillingPlanPriceLabels(minor, yearlySavingsLabel),
  }
}

export function buildSandboxBillingCatalogRead(): Extract<
  BillingCatalogRead,
  { ok: true }
> {
  return buildBillingCatalogFromMinor(
    DEFAULT_BILLING_CATALOG_SANDBOX,
    DEFAULT_BILLING_CATALOG_SANDBOX_YEARLY_SAVINGS_LABEL,
  )
}

function readMinorFromStripePrice(
  price: StripePriceSnapshot,
  expectedInterval: 'month' | 'year',
): number | null {
  if (price.unit_amount == null || price.unit_amount <= 0) return null
  if (price.currency !== 'eur') return null
  if (price.recurring?.interval !== expectedInterval) return null
  return price.unit_amount
}

export function buildBillingCatalogFromStripePrices(
  monthlyPrice: StripePriceSnapshot,
  yearlyPrice: StripePriceSnapshot,
): BillingCatalogRead {
  const monthly = readMinorFromStripePrice(monthlyPrice, 'month')
  const yearly = readMinorFromStripePrice(yearlyPrice, 'year')
  if (monthly == null || yearly == null) {
    return { ok: false, reason: 'invalid_price' }
  }
  const yearlySavingsLabel = readYearlySavingsLabelFromPriceMetadata(
    yearlyPrice.metadata,
  )
  return buildBillingCatalogFromMinor({ monthly, yearly }, yearlySavingsLabel)
}
