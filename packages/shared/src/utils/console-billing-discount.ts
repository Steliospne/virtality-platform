/**
 * Console Profile → Billing Discount display (#68 / #71 / issue #78).
 *
 * Plan-card € rewrite is catalog list × Coupon terms (not invoice preview).
 * Soft-unavailable never invents discounted €. Channel label is only for
 * staff redeem-block; remove affordance is promo-only (#72 / #73).
 */

import {
  applyCouponMinor,
  shouldBillingSoftUnavailable,
  type SubscriptionDiscountRead,
} from './subscription-discount-read.ts'

/** Sandbox Pro catalog list amounts in minor units (€150 / €1500). */
export const PRO_BILLING_CATALOG_MINOR = {
  monthly: 15_000,
  yearly: 150_000,
} as const

export type DiscountedBillingPriceLabels = {
  /** Discounted amount only (e.g. €120). */
  monthlyAmount: string
  yearlyAsMonthlyAmount: string
  yearlyTotalAmount: string
}

export type BillingDiscountDisplay =
  | { kind: 'catalog' }
  | { kind: 'rewrite'; prices: DiscountedBillingPriceLabels }
  | { kind: 'soft_unavailable' }

export const BILLING_SOFT_UNAVAILABLE_COPY =
  'Discount details unavailable right now. Showing catalog list prices only; check Manage in portal or try again shortly.'

export const BILLING_DISCOUNT_TIMING_COPY =
  'Takes effect on the next invoice. Discount-only changes are not prorated.'

export const STAFF_REDEEM_BLOCK_COPY =
  'A staff-applied Discount is already on this subscription, so a Promotion Code cannot be applied. Contact support if you expected a change.'

export const PROMO_REMOVE_NO_RESTORE_COPY =
  'This will not restore a prior staff or campaign discount.'

export const PROMO_REMOVE_SUCCESS_COPY = 'Promotion Code removed'

function formatEurFromMinor(minor: number): string {
  const major = minor / 100
  if (Number.isInteger(major)) return `€${major}`
  return `€${major.toFixed(2)}`
}

/** Catalog list × Coupon in major-display form for plan-card rewrite. */
export function buildDiscountedBillingPriceLabels(terms: {
  percentOff: number | null
  amountOff: number | null
}): DiscountedBillingPriceLabels {
  const monthlyMinor = applyCouponMinor(
    PRO_BILLING_CATALOG_MINOR.monthly,
    terms,
  )
  const yearlyTotalMinor = applyCouponMinor(
    PRO_BILLING_CATALOG_MINOR.yearly,
    terms,
  )
  const yearlyAsMonthlyMinor = Math.round(yearlyTotalMinor / 12)

  return {
    monthlyAmount: formatEurFromMinor(monthlyMinor),
    yearlyAsMonthlyAmount: formatEurFromMinor(yearlyAsMonthlyMinor),
    yearlyTotalAmount: formatEurFromMinor(yearlyTotalMinor),
  }
}

/**
 * Billing plan-card display from a live Subscription Discount read.
 * Soft-unavailable on read failure or incomplete/mismatched Coupon terms.
 */
export function resolveBillingDiscountDisplay(
  read: SubscriptionDiscountRead,
): BillingDiscountDisplay {
  if (shouldBillingSoftUnavailable(read)) {
    return { kind: 'soft_unavailable' }
  }
  if (!read.ok || read.presence === 'none') {
    return { kind: 'catalog' }
  }

  return {
    kind: 'rewrite',
    prices: buildDiscountedBillingPriceLabels({
      percentOff: read.percentOff,
      amountOff: read.amountOff,
    }),
  }
}

type LiveDiscountOne = Extract<
  SubscriptionDiscountRead,
  { ok: true; presence: 'one' }
>

/** Staff Discount blocks redeem chrome (#67); only when read succeeds. */
export function isStaffRedeemBlocked(
  read: SubscriptionDiscountRead,
): read is LiveDiscountOne & { channel: 'staff' } {
  return read.ok && read.presence === 'one' && read.channel === 'staff'
}

/** Clinician may clear only a live promo Discount (#72 / #73). */
export function canRemovePromoDiscount(
  read: SubscriptionDiscountRead,
): read is LiveDiscountOne & { channel: 'promo' } {
  return read.ok && read.presence === 'one' && read.channel === 'promo'
}

/** Customer-facing Promotion Code string when known on a promo Discount. */
export function promoCodeLabel(read: SubscriptionDiscountRead): string | null {
  if (!canRemovePromoDiscount(read)) return null
  const code = read.promotionCode?.trim()
  return code ? code : null
}
