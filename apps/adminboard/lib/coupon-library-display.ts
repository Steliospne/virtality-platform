import {
  COUPON_LIBRARY_CURRENCY,
  type CouponLibraryRecord,
} from '@virtality/shared/utils'

export const COUPON_LIBRARY_DELETE_COPY =
  'Hard-delete removes this Coupon from Stripe. Existing Subscription Discounts continue until the Coupon duration ends or staff removes them.'

export function formatCouponDiscount(coupon: CouponLibraryRecord): string {
  if (coupon.percentOff != null) {
    return `${coupon.percentOff}% off`
  }
  if (coupon.amountOff != null) {
    const major = (coupon.amountOff / 100).toFixed(2)
    const currency = (coupon.currency ?? COUPON_LIBRARY_CURRENCY).toUpperCase()
    return `${major} ${currency} off`
  }
  return '-'
}

export function formatCouponDuration(coupon: CouponLibraryRecord): string {
  if (coupon.duration === 'once') return 'Once'
  if (coupon.duration === 'forever') return 'Forever'
  const months = coupon.durationInMonths
  if (months == null) return 'Repeating'
  if (months === 1) return 'Repeating (1 month)'
  return `Repeating (${months} months)`
}

/** New Coupons apply store-wide (no `applies_to`); legacy ones may still list product ids. */
export function formatCouponAppliesTo(coupon: CouponLibraryRecord): string {
  return coupon.appliesToProductIds.length > 0
    ? coupon.appliesToProductIds.join(', ')
    : 'All products'
}

export function formatCouponName(coupon: CouponLibraryRecord): string {
  return coupon.name ?? coupon.id
}

export function getCouponStateLabel(coupon: CouponLibraryRecord): string {
  return coupon.archived ? 'Archived' : 'Active'
}

export function formatRelativeCreated(createdSeconds: number): string {
  return new Date(createdSeconds * 1000).toLocaleDateString()
}

export function getPromotionSummary(
  codes: readonly { active: boolean; timesRedeemed: number }[],
) {
  const active = codes.filter((code) => code.active).length
  const redeemed = codes.reduce((sum, code) => sum + code.timesRedeemed, 0)
  return { total: codes.length, active, redeemed }
}
