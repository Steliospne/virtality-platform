import { describe, expect, it } from 'vitest'
import {
  formatCouponAppliesTo,
  formatCouponDiscount,
  formatCouponDuration,
} from './coupon-library-display'
import {
  DEFAULT_PLAN_PRODUCT_ID,
  type CouponLibraryRecord,
} from '@virtality/shared/utils'

function coupon(
  overrides: Partial<CouponLibraryRecord> = {},
): CouponLibraryRecord {
  return {
    id: 'cou_1',
    name: 'Test',
    percentOff: 15,
    amountOff: null,
    currency: null,
    duration: 'once',
    durationInMonths: null,
    appliesToProductIds: [DEFAULT_PLAN_PRODUCT_ID],
    archived: false,
    created: 1,
    ...overrides,
  }
}

describe('coupon library display', () => {
  it('formats percent and amount-off discounts', () => {
    expect(formatCouponDiscount(coupon({ percentOff: 20 }))).toBe('20% off')
    expect(
      formatCouponDiscount(
        coupon({
          percentOff: null,
          amountOff: 1500,
          currency: 'eur',
        }),
      ),
    ).toBe('15.00 EUR off')
  })

  it('formats duration including repeating months', () => {
    expect(formatCouponDuration(coupon({ duration: 'forever' }))).toBe(
      'Forever',
    )
    expect(
      formatCouponDuration(
        coupon({ duration: 'repeating', durationInMonths: 3 }),
      ),
    ).toBe('Repeating (3 months)')
  })

  it('shows product ids when applies_to is set', () => {
    expect(formatCouponAppliesTo(coupon())).toBe(DEFAULT_PLAN_PRODUCT_ID)
  })

  it('shows "All products" when applies_to is empty', () => {
    expect(formatCouponAppliesTo(coupon({ appliesToProductIds: [] }))).toBe(
      'All products',
    )
  })
})
