/**
 * Which Promotion Code chrome Billing should show (entry vs Checkout hold vs live).
 */

import {
  canRemovePromoDiscount,
  promoCodeLabel,
  type SubscriptionDiscountRead,
} from '@virtality/shared/utils'

export type PromoRedeemChrome =
  | { kind: 'entry' }
  | { kind: 'pending_hold'; code: string }
  | { kind: 'checking_discount' }
  | { kind: 'redeem_unavailable' }
  | { kind: 'staff_blocked' }
  | {
      kind: 'applied_live'
      code: string | null
      expiresAt: Date | string | null
    }

/** Unified code field stays visible except when a live promo row replaces it. */
export function profileBillingCodeEntryVisible(
  chrome: PromoRedeemChrome,
): boolean {
  return chrome.kind !== 'applied_live'
}

export function resolvePromoRedeemChrome(input: {
  hasEligibleSubscription: boolean
  pendingHoldCode: string | null | undefined
  pendingHoldExpiresAt?: Date | string | null
  discount: SubscriptionDiscountRead | undefined
  staffBlocked: boolean
}): PromoRedeemChrome {
  const pendingHoldCode = input.pendingHoldCode?.trim() || null

  if (!input.hasEligibleSubscription) {
    if (pendingHoldCode) {
      return { kind: 'pending_hold', code: pendingHoldCode }
    }
    return { kind: 'entry' }
  }

  if (input.discount == null) {
    return { kind: 'checking_discount' }
  }

  if (!input.discount.ok) {
    return { kind: 'redeem_unavailable' }
  }

  if (input.staffBlocked) {
    return { kind: 'staff_blocked' }
  }

  if (canRemovePromoDiscount(input.discount)) {
    return {
      kind: 'applied_live',
      code: promoCodeLabel(input.discount),
      expiresAt: input.pendingHoldExpiresAt ?? null,
    }
  }

  return { kind: 'entry' }
}
