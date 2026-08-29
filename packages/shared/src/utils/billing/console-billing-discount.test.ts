import { describe, expect, it } from 'vitest'
import type { SubscriptionDiscountRead } from './subscription-discount-read.ts'
import { PRO_BILLING_CATALOG_SANDBOX } from './billing-catalog.ts'
import {
  buildDiscountedBillingPriceLabels,
  canRemovePromoDiscount,
  isStaffRedeemBlocked,
  resolveBillingDiscountDisplay,
} from './console-billing-discount.ts'

const onePercent: Extract<
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
  promotionCode: 'SPRING20',
  start: 1,
  end: null,
  percentOff: 20,
  amountOff: null,
  currency: null,
  duration: 'once',
  durationInMonths: null,
}

describe('buildDiscountedBillingPriceLabels', () => {
  it('rewrites monthly and yearly catalog list × percent-off Coupon', () => {
    const labels = buildDiscountedBillingPriceLabels(
      {
        percentOff: 20,
        amountOff: null,
      },
      PRO_BILLING_CATALOG_SANDBOX,
    )

    expect(labels).toEqual({
      monthlyAmount: '€120',
      yearlyAsMonthlyAmount: '€100',
      yearlyTotalAmount: '€1200',
    })
  })

  it('subtracts amount-off from each interval list (interval-agnostic)', () => {
    expect(
      buildDiscountedBillingPriceLabels(
        {
          percentOff: null,
          amountOff: 3_000,
        },
        PRO_BILLING_CATALOG_SANDBOX,
      ),
    ).toEqual({
      monthlyAmount: '€120',
      yearlyAsMonthlyAmount: '€122.50',
      yearlyTotalAmount: '€1470',
    })
  })
})

describe('resolveBillingDiscountDisplay', () => {
  it('rewrites plan cards when the live Discount read is healthy', () => {
    const display = resolveBillingDiscountDisplay(
      onePercent,
      PRO_BILLING_CATALOG_SANDBOX,
    )

    expect(display).toEqual({
      kind: 'rewrite',
      prices: {
        monthlyAmount: '€120',
        yearlyAsMonthlyAmount: '€100',
        yearlyTotalAmount: '€1200',
      },
    })
  })

  it('keeps catalog list when no Discount is present', () => {
    expect(
      resolveBillingDiscountDisplay(
        { ok: true, presence: 'none' },
        PRO_BILLING_CATALOG_SANDBOX,
      ),
    ).toEqual({ kind: 'catalog' })
  })

  it('soft-unavailables when the read fails or Coupon terms are incomplete', () => {
    expect(
      resolveBillingDiscountDisplay(
        {
          ok: false,
          reason: 'stripe_unavailable',
        },
        PRO_BILLING_CATALOG_SANDBOX,
      ),
    ).toEqual({ kind: 'soft_unavailable' })

    expect(
      resolveBillingDiscountDisplay(
        {
          ...onePercent,
          percentOff: null,
          amountOff: null,
        },
        PRO_BILLING_CATALOG_SANDBOX,
      ),
    ).toEqual({ kind: 'soft_unavailable' })

    expect(
      resolveBillingDiscountDisplay(
        {
          ...onePercent,
          percentOff: null,
          amountOff: 3_000,
          currency: 'usd',
        },
        PRO_BILLING_CATALOG_SANDBOX,
      ),
    ).toEqual({ kind: 'soft_unavailable' })
  })
})

describe('redeem and remove chrome gates', () => {
  it('blocks redeem only for a live staff Discount', () => {
    expect(isStaffRedeemBlocked(onePercent)).toBe(false)
    expect(
      isStaffRedeemBlocked({
        ...onePercent,
        channel: 'staff',
        promotionCodeId: null,
        promotionCode: null,
      }),
    ).toBe(true)
    expect(isStaffRedeemBlocked({ ok: true, presence: 'none' })).toBe(false)
    expect(
      isStaffRedeemBlocked({ ok: false, reason: 'stripe_unavailable' }),
    ).toBe(false)
  })

  it('allows remove only for a live promo Discount', () => {
    expect(canRemovePromoDiscount(onePercent)).toBe(true)
    expect(
      canRemovePromoDiscount({
        ...onePercent,
        channel: 'campaign',
        promotionCodeId: null,
        promotionCode: null,
      }),
    ).toBe(false)
    expect(canRemovePromoDiscount({ ok: true, presence: 'none' })).toBe(false)
  })
})
