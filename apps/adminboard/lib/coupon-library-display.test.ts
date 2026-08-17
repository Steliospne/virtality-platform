import { describe, expect, it } from 'vitest'
import {
  formatCouponAppliesTo,
  formatCouponDiscount,
  formatCouponDuration,
} from './coupon-library-display'
import {
  PRO_PLAN_PRODUCT_ID,
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
    appliesToProductIds: [PRO_PLAN_PRODUCT_ID],
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

  it('maps Pro product applies_to to plan label', () => {
    expect(formatCouponAppliesTo(coupon())).toBe('Pro')
  })
})
