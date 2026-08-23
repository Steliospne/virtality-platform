import { describe, expect, it } from 'vitest'
import {
  buildBillingPlanPriceLabels,
  FREE_SUBSCRIPTION_PLAN,
  PRO_BILLING_CATALOG_SANDBOX,
  PRO_SUBSCRIPTION_PLAN,
} from '@virtality/shared/utils'
import {
  buildPendingCouponRewrite,
  profileBillingDiscountDisplay,
  profileBillingOpensPortal,
  profileBillingPlanCardCheckoutLabel,
  profileBillingPrimaryCtaLabel,
  profileBillingShowsPlanCardCheckout,
  profileBillingShowsPromoChrome,
  profileBillingStatusDetail,
  profileBillingStatusHeadline,
  splitCatalogPriceLabel,
  type BillingStandingView,
} from './profile-billing.js'

const base: BillingStandingView = {
  entitled: false,
  status: null,
  plan: null,
  billingPathEstablished: false,
  hadPaidBilling: false,
  billingInterval: null,
  clockEnd: null,
}

describe('profileBillingPrimaryCtaLabel', () => {
  it('shows Manage billing only for entitled paid Pro seats', () => {
    expect(
      profileBillingPrimaryCtaLabel({
        ...base,
        entitled: true,
        status: 'active',
        plan: PRO_SUBSCRIPTION_PLAN,
      }),
    ).toBe('Manage billing')
  })

  it('hides the centralized CTA for Free and trialing clinicians', () => {
    expect(
      profileBillingPrimaryCtaLabel({
        ...base,
        entitled: true,
        status: 'trialing',
        plan: FREE_SUBSCRIPTION_PLAN,
        billingPathEstablished: true,
      }),
    ).toBeNull()
    expect(profileBillingPrimaryCtaLabel(base)).toBeNull()
  })
})

describe('profileBillingOpensPortal', () => {
  it('is true only for entitled paid Pro subscriptions', () => {
    expect(
      profileBillingOpensPortal({
        entitled: true,
        status: 'active',
        plan: PRO_SUBSCRIPTION_PLAN,
      }),
    ).toBe(true)
    expect(
      profileBillingOpensPortal({
        entitled: true,
        status: 'trialing',
        plan: FREE_SUBSCRIPTION_PLAN,
      }),
    ).toBe(false)
    expect(
      profileBillingOpensPortal({
        entitled: false,
        status: 'active',
        plan: FREE_SUBSCRIPTION_PLAN,
      }),
    ).toBe(false)
  })
})

describe('profileBillingShowsPlanCardCheckout', () => {
  it('offers Checkout on plan cards for Free and trialing clinicians', () => {
    expect(
      profileBillingShowsPlanCardCheckout(
        {
          ...base,
          entitled: true,
          status: 'trialing',
          plan: FREE_SUBSCRIPTION_PLAN,
          billingPathEstablished: true,
        },
        true,
      ),
    ).toBe(true)
    expect(
      profileBillingShowsPlanCardCheckout(
        {
          ...base,
          entitled: false,
          status: 'active',
          plan: FREE_SUBSCRIPTION_PLAN,
          billingPathEstablished: true,
        },
        true,
      ),
    ).toBe(true)
  })

  it('hides plan-card Checkout for entitled paid Pro seats', () => {
    expect(
      profileBillingShowsPlanCardCheckout(
        {
          ...base,
          entitled: true,
          status: 'active',
          plan: PRO_SUBSCRIPTION_PLAN,
        },
        true,
      ),
    ).toBe(false)
  })
})

describe('profileBillingPlanCardCheckoutLabel', () => {
  it('uses Become a paying customer when a Customer exists without Billing Path', () => {
    expect(profileBillingPlanCardCheckoutLabel(base, true)).toBe(
      'Become a paying customer',
    )
  })

  it('uses Subscribe after Billing Path without paid history', () => {
    expect(
      profileBillingPlanCardCheckoutLabel(
        { ...base, billingPathEstablished: true },
        true,
      ),
    ).toBe('Subscribe')
  })

  it('uses Renew after paid history', () => {
    expect(
      profileBillingPlanCardCheckoutLabel(
        {
          ...base,
          billingPathEstablished: true,
          hadPaidBilling: true,
        },
        true,
      ),
    ).toBe('Renew')
  })

  it('uses Subscribe when no Stripe Customer is linked', () => {
    expect(profileBillingPlanCardCheckoutLabel(base, false)).toBe('Subscribe')
  })
})

describe('profileBillingStatusHeadline', () => {
  it('describes active, trial, and empty seats', () => {
    expect(
      profileBillingStatusHeadline({
        ...base,
        entitled: true,
        status: 'active',
        plan: PRO_SUBSCRIPTION_PLAN,
        billingInterval: 'year',
      }),
    ).toBe('Pro · Yearly')
    expect(
      profileBillingStatusHeadline({
        ...base,
        entitled: true,
        status: 'trialing',
        plan: FREE_SUBSCRIPTION_PLAN,
      }),
    ).toBe('Trial in progress')
    expect(
      profileBillingStatusHeadline({
        ...base,
        entitled: false,
        status: 'active',
        plan: FREE_SUBSCRIPTION_PLAN,
      }),
    ).toBe('Free')
    expect(profileBillingStatusHeadline(base)).toBe('No plan yet')
  })
})

describe('profileBillingStatusDetail', () => {
  it('prompts interval choice when there is no live clock', () => {
    expect(profileBillingStatusDetail(base)).toMatch(/Monthly or Yearly/)
  })
})

describe('profileBillingShowsPromoChrome', () => {
  it('shows promo chrome on entitled eligible statuses and on all non-entitled seats', () => {
    expect(
      profileBillingShowsPromoChrome({ entitled: true, status: 'active' }),
    ).toBe(true)
    expect(
      profileBillingShowsPromoChrome({ entitled: true, status: 'trialing' }),
    ).toBe(true)
    expect(
      profileBillingShowsPromoChrome({ entitled: true, status: 'past_due' }),
    ).toBe(true)
    expect(
      profileBillingShowsPromoChrome({ entitled: true, status: 'canceled' }),
    ).toBe(false)
    expect(
      profileBillingShowsPromoChrome({ entitled: false, status: null }),
    ).toBe(true)
  })
})

describe('profileBillingDiscountDisplay', () => {
  it('rewrites when a healthy Discount is present', () => {
    expect(
      profileBillingDiscountDisplay(
        {
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
        },
        PRO_BILLING_CATALOG_SANDBOX,
      ),
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
      profileBillingDiscountDisplay(
        {
          ok: false,
          reason: 'stripe_unavailable',
        },
        PRO_BILLING_CATALOG_SANDBOX,
      ),
    ).toEqual({ kind: 'soft_unavailable' })
  })
})

describe('buildPendingCouponRewrite', () => {
  const prices = buildBillingPlanPriceLabels(PRO_BILLING_CATALOG_SANDBOX)

  it('rewrites plan card prices from pending coupon percent-off terms', () => {
    const rewrite = buildPendingCouponRewrite(
      { percentOff: 20, amountOff: null },
      PRO_BILLING_CATALOG_SANDBOX,
      prices,
    )

    expect(rewrite.monthly.discountedPrimary).toBe('€120')
    expect(rewrite.monthly.listStrike).toBe(prices.monthlyLabel)
    expect(rewrite.yearly.discountedPrimary).toBe('€100')
    expect(rewrite.yearly.listStrike).toBe(prices.yearlyAsMonthlyLabel)
    expect(rewrite.yearly.discountedMuted).toBe('€1200')
    expect(rewrite.yearly.listStrikeMuted).toBe(prices.yearlyTotalMutedLabel)
  })

  it('rewrites plan card prices from pending coupon amount-off terms', () => {
    const rewrite = buildPendingCouponRewrite(
      { percentOff: null, amountOff: 5000 },
      PRO_BILLING_CATALOG_SANDBOX,
      prices,
    )

    expect(rewrite.monthly.discountedPrimary).toBe('€100')
    expect(rewrite.yearly.discountedMuted).toBe('€1450')
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
