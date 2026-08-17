import { describe, expect, it } from 'vitest'
import {
  profileBillingDiscountDisplay,
  profileBillingOpensPortal,
  profileBillingPrimaryCtaLabel,
  profileBillingShowsPromoChrome,
  profileBillingStatusDetail,
  profileBillingStatusHeadline,
  splitCatalogPriceLabel,
  type BillingStandingView,
} from './profile-billing.js'

const base: BillingStandingView = {
  entitled: false,
  status: null,
  billingPathEstablished: false,
  hadPaidBilling: false,
  billingInterval: null,
  clockEnd: null,
}

describe('profileBillingPrimaryCtaLabel', () => {
  it('opens portal copy while entitled', () => {
    expect(
      profileBillingPrimaryCtaLabel(
        { ...base, entitled: true, status: 'active' },
        true,
      ),
    ).toBe('Manage in portal')
  })

  it('uses Become a paying customer when Customer exists without Billing Path', () => {
    expect(profileBillingPrimaryCtaLabel(base, true)).toBe(
      'Become a paying customer',
    )
  })

  it('uses Subscribe after Billing Path without paid history', () => {
    expect(
      profileBillingPrimaryCtaLabel(
        { ...base, billingPathEstablished: true },
        true,
      ),
    ).toBe('Subscribe')
  })

  it('uses Renew after paid history', () => {
    expect(
      profileBillingPrimaryCtaLabel(
        {
          ...base,
          billingPathEstablished: true,
          hadPaidBilling: true,
        },
        true,
      ),
    ).toBe('Renew')
  })

  it('hides CTA without a Stripe Customer', () => {
    expect(profileBillingPrimaryCtaLabel(base, false)).toBeNull()
  })
})

describe('profileBillingOpensPortal', () => {
  it('is true only while entitled', () => {
    expect(profileBillingOpensPortal({ entitled: true })).toBe(true)
    expect(profileBillingOpensPortal({ entitled: false })).toBe(false)
  })
})

describe('profileBillingStatusHeadline', () => {
  it('describes active, trial, and empty seats', () => {
    expect(
      profileBillingStatusHeadline({
        ...base,
        entitled: true,
        status: 'active',
        billingInterval: 'year',
      }),
    ).toBe('Pro · Yearly')
    expect(
      profileBillingStatusHeadline({
        ...base,
        entitled: true,
        status: 'trialing',
      }),
    ).toBe('Trial in progress')
    expect(profileBillingStatusHeadline(base)).toBe('No plan yet')
  })
})

describe('profileBillingStatusDetail', () => {
  it('prompts interval choice when there is no live clock', () => {
    expect(profileBillingStatusDetail(base)).toMatch(/Monthly or Yearly/)
  })
})

describe('profileBillingShowsPromoChrome', () => {
  it('shows redeem/remove chrome only on eligible statuses', () => {
    expect(profileBillingShowsPromoChrome({ status: 'active' })).toBe(true)
    expect(profileBillingShowsPromoChrome({ status: 'trialing' })).toBe(true)
    expect(profileBillingShowsPromoChrome({ status: 'past_due' })).toBe(true)
    expect(profileBillingShowsPromoChrome({ status: 'canceled' })).toBe(false)
    expect(profileBillingShowsPromoChrome({ status: null })).toBe(false)
  })
})

describe('profileBillingDiscountDisplay', () => {
  it('rewrites when a healthy Discount is present', () => {
    expect(
      profileBillingDiscountDisplay({
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
      }),
    ).toEqual({
      kind: 'rewrite',
      prices: {
        monthlyAmount: '€120',
        yearlyAsMonthlyAmount: '€100',
        yearlyTotalAmount: '€1200',
      },
    })
  })

  it('soft-unavailables when Discount terms are missing', () => {
    expect(
      profileBillingDiscountDisplay({
        ok: false,
        reason: 'stripe_unavailable',
      }),
    ).toEqual({ kind: 'soft_unavailable' })
  })
})

describe('splitCatalogPriceLabel', () => {
  it('keeps interval outside the struck catalog amount', () => {
    expect(splitCatalogPriceLabel('€150 / month')).toEqual({
      amount: '€150',
      interval: '/ month',
    })
  })
})
