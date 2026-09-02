import { describe, expect, it } from 'vitest'
import type { SubscriptionDiscountRead } from '@virtality/shared/utils'
import { resolvePromoRedeemChrome } from './promo-redeem-chrome.ts'

const none: SubscriptionDiscountRead = { ok: true, presence: 'none' }

const livePromo: Extract<
  SubscriptionDiscountRead,
  { ok: true; presence: 'one' }
> = {
  ok: true,
  presence: 'one',
  channel: 'promo',
  discountId: 'di_1',
  couponId: 'cou_1',
  couponName: 'Spring',
  promotionCodeId: 'promo_1',
  promotionCode: 'SAVE10',
  start: 1,
  end: null,
  percentOff: 10,
  amountOff: null,
  currency: null,
  duration: 'once',
  durationInMonths: null,
}

describe('resolvePromoRedeemChrome', () => {
  it('shows Checkout hold when a pending Promotion Code is open and there is no eligible seat', () => {
    expect(
      resolvePromoRedeemChrome({
        hasEligibleSubscription: false,
        pendingHoldCode: 'SAVE10',
        pendingHoldExpiresAt: null,
        discount: none,
        staffBlocked: false,
      }),
    ).toEqual({ kind: 'pending_hold', code: 'SAVE10' })
  })

  it('shows entry when there is no eligible seat and no pending hold', () => {
    expect(
      resolvePromoRedeemChrome({
        hasEligibleSubscription: false,
        pendingHoldCode: null,
        discount: none,
        staffBlocked: false,
      }),
    ).toEqual({ kind: 'entry' })
  })

  it('prefers pending hold over an empty entry field after Apply clears the input', () => {
    expect(
      resolvePromoRedeemChrome({
        hasEligibleSubscription: false,
        pendingHoldCode: 'SAVE10',
        discount: undefined,
        staffBlocked: false,
      }).kind,
    ).toBe('pending_hold')
  })

  it('shows live applied promo when the seat is eligible', () => {
    const expiresAt = new Date('2026-09-02T12:00:00Z')
    expect(
      resolvePromoRedeemChrome({
        hasEligibleSubscription: true,
        pendingHoldCode: null,
        pendingHoldExpiresAt: expiresAt,
        discount: livePromo,
        staffBlocked: false,
      }),
    ).toEqual({ kind: 'applied_live', code: 'SAVE10', expiresAt })
  })

  it('shows staff_blocked when staff discount blocks promo redeem', () => {
    expect(
      resolvePromoRedeemChrome({
        hasEligibleSubscription: true,
        pendingHoldCode: null,
        discount: {
          ...livePromo,
          channel: 'staff',
        },
        staffBlocked: true,
      }),
    ).toEqual({ kind: 'staff_blocked' })
  })
})
