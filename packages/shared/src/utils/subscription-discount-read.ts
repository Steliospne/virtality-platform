/**
 * Shared live Subscription Discount + channel read (#70 + #71 / issue #74).
 *
 * SoT: Stripe `subscriptions.retrieve` with `expand: ['discounts.promotion_code']`
 * via raw Stripe SDK (not Better Auth subscription APIs; not local Discount columns).
 *
 * Caller error policy (same read, different handling):
 * - Adminboard confirm (apply/replace/remove): fail closed on `ok: false`
 * - Console redeem preflight / redeem: fail closed on `ok: false`
 * - Billing Discount/channel display: soft-unavailable on `ok: false` (and on
 *   incomplete Coupon terms; see `shouldBillingSoftUnavailable`)
 */

export type DiscountChannel = 'staff' | 'promo' | 'campaign'

export type SubscriptionDiscountReadFailureReason =
  | 'stripe_unavailable'
  | 'subscription_missing'
  | 'stacked_or_unsupported'
  | 'registry_unavailable'

export type SubscriptionDiscountRead =
  | { ok: true; presence: 'none' }
  | {
      ok: true
      presence: 'one'
      channel: DiscountChannel
      discountId: string
      couponId: string
      couponName: string | null
      promotionCodeId: string | null
      promotionCode: string | null
      start: number
      end: number | null
      percentOff: number | null
      amountOff: number | null
      currency: string | null
      duration: 'forever' | 'once' | 'repeating'
      durationInMonths: number | null
    }
  | {
      ok: false
      reason: SubscriptionDiscountReadFailureReason
    }

export type SubscriptionDiscountCouponSnapshot = {
  id: string
  name: string | null
  percent_off: number | null
  amount_off: number | null
  currency: string | null
  duration: 'forever' | 'once' | 'repeating'
  duration_in_months: number | null
}

export type SubscriptionDiscountEntrySnapshot = {
  id: string
  start: number
  end: number | null
  promotion_code: string | { id: string; code: string } | null
  coupon: SubscriptionDiscountCouponSnapshot
}

export type SubscriptionDiscountStripeSnapshot = {
  discounts: SubscriptionDiscountEntrySnapshot[] | null
  items?: {
    data: Array<{
      discounts?: Array<unknown> | null
    }>
  }
}

export type SubscriptionDiscountStripeGateway = {
  retrieveSubscriptionWithDiscounts: (
    stripeSubscriptionId: string,
  ) => Promise<
    | { ok: true; subscription: SubscriptionDiscountStripeSnapshot }
    | { ok: false; reason: 'subscription_missing' | 'stripe_unavailable' }
  >
}

/** Campaign registry membership seam (#70 / #74). */
export type CampaignRegistry = {
  isCampaignCouponId: (couponId: string) => Promise<boolean>
}

function hasItemLevelDiscounts(
  snapshot: SubscriptionDiscountStripeSnapshot,
): boolean {
  const items = snapshot.items?.data ?? []
  return items.some((item) => (item.discounts?.length ?? 0) > 0)
}

function promotionFields(
  promotionCode: SubscriptionDiscountEntrySnapshot['promotion_code'],
): { promotionCodeId: string | null; promotionCode: string | null } {
  if (promotionCode == null) {
    return { promotionCodeId: null, promotionCode: null }
  }
  if (typeof promotionCode === 'string') {
    return { promotionCodeId: promotionCode, promotionCode: null }
  }
  return {
    promotionCodeId: promotionCode.id,
    promotionCode: promotionCode.code,
  }
}

/**
 * Classify a retrieved Subscription Discount snapshot (presence + channel).
 * Does not call Stripe; registry is only consulted when presence is `one`
 * and the Discount is not promo.
 */
export async function classifySubscriptionDiscount(
  snapshot: SubscriptionDiscountStripeSnapshot,
  registry: CampaignRegistry,
): Promise<SubscriptionDiscountRead> {
  if (hasItemLevelDiscounts(snapshot)) {
    return { ok: false, reason: 'stacked_or_unsupported' }
  }

  const discounts = snapshot.discounts ?? []
  if (discounts.length === 0) {
    return { ok: true, presence: 'none' }
  }
  if (discounts.length > 1) {
    return { ok: false, reason: 'stacked_or_unsupported' }
  }

  const entry = discounts[0]!
  const { promotionCodeId, promotionCode } = promotionFields(
    entry.promotion_code,
  )

  let channel: DiscountChannel
  if (promotionCodeId != null) {
    channel = 'promo'
  } else {
    let isCampaign: boolean
    try {
      isCampaign = await registry.isCampaignCouponId(entry.coupon.id)
    } catch {
      return { ok: false, reason: 'registry_unavailable' }
    }
    channel = isCampaign ? 'campaign' : 'staff'
  }

  return {
    ok: true,
    presence: 'one',
    channel,
    discountId: entry.id,
    couponId: entry.coupon.id,
    couponName: entry.coupon.name,
    promotionCodeId,
    promotionCode,
    start: entry.start,
    end: entry.end,
    percentOff: entry.coupon.percent_off,
    amountOff: entry.coupon.amount_off,
    currency: entry.coupon.currency,
    duration: entry.coupon.duration,
    durationInMonths: entry.coupon.duration_in_months,
  }
}

/**
 * Live Subscription Discount read: missing local id, Stripe retrieve, then classify.
 */
export async function readSubscriptionDiscount(
  input: { stripeSubscriptionId: string | null | undefined },
  stripe: SubscriptionDiscountStripeGateway,
  registry: CampaignRegistry,
): Promise<SubscriptionDiscountRead> {
  const stripeSubscriptionId = input.stripeSubscriptionId?.trim()
  if (!stripeSubscriptionId) {
    return { ok: false, reason: 'subscription_missing' }
  }

  let retrieved: Awaited<
    ReturnType<
      SubscriptionDiscountStripeGateway['retrieveSubscriptionWithDiscounts']
    >
  >
  try {
    retrieved =
      await stripe.retrieveSubscriptionWithDiscounts(stripeSubscriptionId)
  } catch {
    return { ok: false, reason: 'stripe_unavailable' }
  }

  if (!retrieved.ok) {
    return { ok: false, reason: retrieved.reason }
  }

  return classifySubscriptionDiscount(retrieved.subscription, registry)
}

/** Billing soft-unavailable gate (#71): never invent discounted €. */
export function shouldBillingSoftUnavailable(
  result: SubscriptionDiscountRead,
): boolean {
  if (!result.ok) return true
  if (result.presence === 'none') return false
  if (result.percentOff == null && result.amountOff == null) return true
  if (
    result.amountOff != null &&
    (result.currency == null || result.currency !== 'eur')
  ) {
    return true
  }
  return false
}

/** Catalog list × Coupon in minor units (#71). Amount-off is interval-agnostic. */
export function applyCouponMinor(
  listMinor: number,
  terms: { percentOff: number | null; amountOff: number | null },
): number {
  if (terms.percentOff != null) {
    return Math.round((listMinor * (100 - terms.percentOff)) / 100)
  }
  if (terms.amountOff != null) {
    return Math.max(0, listMinor - terms.amountOff)
  }
  return listMinor
}
