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
  profileBillingSchedulesAtPeriodEnd,
  profileBillingShowsPlanCardCheckout,
  profileBillingShowsPromoChrome,
  profileBillingStatusDetail,
  profileBillingStatusHeadline,
  splitCatalogPriceLabel,
  type BillingStandingView,
  PAID_CANCELLATION_UNDO_LABEL,
  PAID_INTERVAL_CANCEL_LABEL,
  PAID_INTERVAL_UPDATE_LABEL,
  profileBillingPendingCancellationBanner,
  profileBillingPendingPlanChangeBanner,
} from './profile-billing.js'

const base: BillingStandingView = {
  entitled: false,
  status: null,
  plan: null,
  billingPathEstablished: false,
  hadPaidBilling: false,
  billingInterval: null,
  clockEnd: null,
  hasPendingPlanChange: false,
  cancelAtPeriodEnd: false,
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

  it('offers plan-card actions for entitled paid Pro seats (interval switch)', () => {
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
    ).toBe(true)
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

  it('offers Update only on the other paid Pro interval', () => {
    const standing: BillingStandingView = {
      ...base,
      entitled: true,
      status: 'active',
      plan: PRO_SUBSCRIPTION_PLAN,
      billingInterval: 'month',
    }
    expect(profileBillingPlanCardCheckoutLabel(standing, true, 'month')).toBe(
      null,
    )
    expect(profileBillingPlanCardCheckoutLabel(standing, true, 'year')).toBe(
      PAID_INTERVAL_UPDATE_LABEL,
    )
  })

  it('offers Cancel on the target interval when a switch is scheduled', () => {
    const standing: BillingStandingView = {
      ...base,
      entitled: true,
      status: 'active',
      plan: PRO_SUBSCRIPTION_PLAN,
      billingInterval: 'month',
      hasPendingPlanChange: true,
      clockEnd: '2026-09-10T12:00:00.000Z',
    }
    expect(profileBillingPlanCardCheckoutLabel(standing, true, 'month')).toBe(
      null,
    )
    expect(profileBillingPlanCardCheckoutLabel(standing, true, 'year')).toBe(
      PAID_INTERVAL_CANCEL_LABEL,
    )
  })

  it("offers Don't cancel on the active interval and Update on the other when cancel-at-period-end", () => {
    const standing: BillingStandingView = {
      ...base,
      entitled: true,
      status: 'active',
      plan: PRO_SUBSCRIPTION_PLAN,
      billingInterval: 'month',
      cancelAtPeriodEnd: true,
      clockEnd: '2026-09-10T12:00:00.000Z',
    }
    expect(profileBillingPlanCardCheckoutLabel(standing, true, 'month')).toBe(
      PAID_CANCELLATION_UNDO_LABEL,
    )
    expect(profileBillingPlanCardCheckoutLabel(standing, true, 'year')).toBe(
      PAID_INTERVAL_UPDATE_LABEL,
    )
  })
})

describe('profileBillingPendingPlanChangeBanner', () => {
  it('names the target plan and renewal when a switch is scheduled', () => {
    const banner = profileBillingPendingPlanChangeBanner({
      ...base,
      entitled: true,
      status: 'active',
      plan: PRO_SUBSCRIPTION_PLAN,
      billingInterval: 'month',
      hasPendingPlanChange: true,
      clockEnd: '2026-09-10T12:00:00.000Z',
    })
    expect(banner).toMatch(/Switching to Yearly/)
    expect(banner).toMatch(/Payment starts/)
  })
})

describe('profileBillingPendingCancellationBanner', () => {
  it('warns that access ends at the next cycle', () => {
    const banner = profileBillingPendingCancellationBanner({
      ...base,
      entitled: true,
      status: 'active',
      plan: PRO_SUBSCRIPTION_PLAN,
      billingInterval: 'month',
      cancelAtPeriodEnd: true,
      clockEnd: '2026-09-10T12:00:00.000Z',
    })
    expect(banner).toMatch(/subscription ends/)
    expect(banner).toMatch(/keep Pro access/i)
  })

  it('is absent when cancel-at-period-end is not scheduled', () => {
    expect(
      profileBillingPendingCancellationBanner({
        ...base,
        entitled: true,
        status: 'active',
        plan: PRO_SUBSCRIPTION_PLAN,
        billingInterval: 'month',
        clockEnd: '2026-09-10T12:00:00.000Z',
      }),
    ).toBeNull()
  })
})

describe('profileBillingSchedulesAtPeriodEnd', () => {
  it('is true only for live paid Pro seats that are not canceling', () => {
    expect(
      profileBillingSchedulesAtPeriodEnd({
        entitled: true,
        status: 'active',
        plan: PRO_SUBSCRIPTION_PLAN,
        cancelAtPeriodEnd: false,
      }),
    ).toBe(true)
    expect(
      profileBillingSchedulesAtPeriodEnd({
        entitled: true,
        status: 'active',
        plan: PRO_SUBSCRIPTION_PLAN,
        cancelAtPeriodEnd: true,
      }),
    ).toBe(false)
    expect(
      profileBillingSchedulesAtPeriodEnd({
        entitled: true,
        status: 'trialing',
        plan: FREE_SUBSCRIPTION_PLAN,
        cancelAtPeriodEnd: false,
      }),
    ).toBe(false)
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

  it('mentions the scheduled target plan beside the renewal date', () => {
    expect(
      profileBillingStatusDetail({
        ...base,
        entitled: true,
        status: 'active',
        plan: PRO_SUBSCRIPTION_PLAN,
        billingInterval: 'month',
        hasPendingPlanChange: true,
        clockEnd: '2026-09-10T12:00:00.000Z',
      }),
    ).toMatch(/switching to Yearly/)
  })

  it('says Ends when cancel-at-period-end is scheduled', () => {
    expect(
      profileBillingStatusDetail({
        ...base,
        entitled: true,
        status: 'active',
        plan: PRO_SUBSCRIPTION_PLAN,
        billingInterval: 'month',
        cancelAtPeriodEnd: true,
        clockEnd: '2026-09-10T12:00:00.000Z',
      }),
    ).toMatch(/^Ends /)
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
