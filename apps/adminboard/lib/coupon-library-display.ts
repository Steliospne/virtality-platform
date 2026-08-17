import {
  COUPON_LIBRARY_CURRENCY,
  COUPON_LIBRARY_PLANS,
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

export function formatCouponAppliesTo(coupon: CouponLibraryRecord): string {
  const labels = coupon.appliesToProductIds.map((productId) => {
    const plan = COUPON_LIBRARY_PLANS.find(
      (entry) => entry.productId === productId,
    )
    return plan?.label ?? productId
  })
  return labels.length > 0 ? labels.join(', ') : '-'
}
