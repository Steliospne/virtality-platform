import { describe, expect, it } from 'vitest'
import {
  buildBillingPlanPriceLabels,
  FREE_SUBSCRIPTION_PLAN,
  PRO_BILLING_CATALOG_SANDBOX,
  PRO_SUBSCRIPTION_PLAN,
} from '@virtality/shared/utils'
import {
  buildPendingCouponRewrite,
  buildBillingCompareAtCardDisplay,
  profileBillingDiscountDisplay,
  profileBillingOpensPortal,
  profileBillingPrimaryCtaLabel,
  profileBillingSchedulesAtPeriodEnd,
  profileBillingShowsPlanCardCheckout,
  profileBillingShowsPromoChrome,
  profileBillingStatusDetail,
  profileBillingStatusHeadline,
  resolveProfileBillingCardAction,
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

describe('resolveProfileBillingCardAction', () => {
  it('uses Become a paying customer checkout when a Customer exists without Billing Path', () => {
    expect(resolveProfileBillingCardAction(base, true, 'month')).toEqual({
      kind: 'checkout',
      label: 'Become a paying customer',
      pendingLabel: 'Starting Checkout…',
    })
  })

  it('uses Subscribe checkout after Billing Path without paid history', () => {
    expect(
      resolveProfileBillingCardAction(
        { ...base, billingPathEstablished: true },
        true,
        'year',
      ),
    ).toEqual({
      kind: 'checkout',
      label: 'Subscribe',
      pendingLabel: 'Starting Checkout…',
    })
  })

  it('uses Renew checkout after paid history', () => {
    expect(
      resolveProfileBillingCardAction(
        {
          ...base,
          billingPathEstablished: true,
          hadPaidBilling: true,
        },
        true,
        'month',
      ),
    ).toEqual({
      kind: 'checkout',
      label: 'Renew',
      pendingLabel: 'Starting Checkout…',
    })
  })

  it('uses Subscribe checkout when no Stripe Customer is linked', () => {
    expect(resolveProfileBillingCardAction(base, false, 'month')).toEqual({
      kind: 'checkout',
      label: 'Subscribe',
      pendingLabel: 'Starting Checkout…',
    })
  })

  it('schedules Update on the other paid Pro interval with confirm copy', () => {
    const standing: BillingStandingView = {
      ...base,
      entitled: true,
      status: 'active',
      plan: PRO_SUBSCRIPTION_PLAN,
      billingInterval: 'month',
      clockEnd: '2026-09-10T12:00:00.000Z',
    }
    expect(resolveProfileBillingCardAction(standing, true, 'month')).toEqual({
      kind: 'none',
      label: null,
      pendingLabel: null,
    })
    const year = resolveProfileBillingCardAction(standing, true, 'year')
    expect(year.kind).toBe('schedule')
    expect(year.label).toBe(PAID_INTERVAL_UPDATE_LABEL)
    expect(year.pendingLabel).toBe('Updating…')
    expect(year).toMatchObject({
      confirm: {
        title: 'Switch to Yearly?',
        confirmLabel: PAID_INTERVAL_UPDATE_LABEL,
      },
    })
    expect(year.kind === 'schedule' && year.confirm.body).toMatch(
      /Payment starts at your next billing cycle/,
    )
  })

  it('cancels the scheduled switch on the target interval with confirm copy', () => {
    const standing: BillingStandingView = {
      ...base,
      entitled: true,
      status: 'active',
      plan: PRO_SUBSCRIPTION_PLAN,
      billingInterval: 'month',
      hasPendingPlanChange: true,
      clockEnd: '2026-09-10T12:00:00.000Z',
    }
    expect(resolveProfileBillingCardAction(standing, true, 'month')).toEqual({
      kind: 'none',
      label: null,
      pendingLabel: null,
    })
    expect(resolveProfileBillingCardAction(standing, true, 'year')).toEqual({
      kind: 'cancel_schedule',
      label: PAID_INTERVAL_CANCEL_LABEL,
      pendingLabel: 'Canceling…',
      confirm: {
        title: 'Cancel switch to Yearly?',
        body: "You'll stay on your current plan and renew as usual.",
        confirmLabel: PAID_INTERVAL_CANCEL_LABEL,
      },
    })
  })

  it('restores cancellation on the active interval and checkouts Update on the other when cancel-at-period-end', () => {
    const standing: BillingStandingView = {
      ...base,
      entitled: true,
      status: 'active',
      plan: PRO_SUBSCRIPTION_PLAN,
      billingInterval: 'month',
      cancelAtPeriodEnd: true,
      clockEnd: '2026-09-10T12:00:00.000Z',
    }
    expect(resolveProfileBillingCardAction(standing, true, 'month')).toEqual({
      kind: 'restore_cancellation',
      label: PAID_CANCELLATION_UNDO_LABEL,
      pendingLabel: 'Restoring…',
    })
    expect(resolveProfileBillingCardAction(standing, true, 'year')).toEqual({
      kind: 'checkout',
      label: PAID_INTERVAL_UPDATE_LABEL,
      pendingLabel: 'Updating…',
    })
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

describe('buildBillingCompareAtCardDisplay', () => {
  const basic = buildBillingPlanPriceLabels(PRO_BILLING_CATALOG_SANDBOX)
  const assigned = buildBillingPlanPriceLabels({
    monthly: 9_900,
    yearly: 99_000,
  })

  it('shows a single clean catalog row for basic seats', () => {
    const card = buildBillingCompareAtCardDisplay({
      assigned: basic,
      basic,
      showCompareAt: false,
    })
    expect(card.monthlyRows).toEqual([
      { kind: 'catalog', price: basic.monthlyLabel },
    ])
    expect(card.yearlyRows).toHaveLength(1)
    expect(card.yearlyRows[0]?.kind).toBe('catalog')
  })

  it('stacks assigned then struck basic when showCompareAt', () => {
    const card = buildBillingCompareAtCardDisplay({
      assigned,
      basic,
      showCompareAt: true,
    })
    expect(card.monthlyRows).toEqual([
      { kind: 'catalog', price: assigned.monthlyLabel },
      { kind: 'struck', price: basic.monthlyLabel },
    ])
    expect(card.yearlyRows[0]).toMatchObject({ kind: 'catalog' })
    expect(card.yearlyRows[1]).toMatchObject({
      kind: 'struck',
      lines: {
        primary: basic.yearlyAsMonthlyLabel,
        secondary: basic.yearlyTotalMutedLabel,
      },
    })
  })

  it('applies discount to assigned only and leaves basic struck unchanged', () => {
    const discountPrices = {
      monthlyAmount: '€79.20',
      yearlyAsMonthlyAmount: '€66',
      yearlyTotalAmount: '€792',
    }
    const card = buildBillingCompareAtCardDisplay({
      assigned,
      basic,
      showCompareAt: true,
      discountPrices,
    })
    expect(card.monthlyRows[0]?.kind).toBe('discount-inline')
    expect(card.monthlyRows[1]).toEqual({
      kind: 'struck',
      price: basic.monthlyLabel,
    })
    expect(card.yearlyRows[1]).toMatchObject({
      kind: 'struck',
      lines: {
        primary: basic.yearlyAsMonthlyLabel,
        secondary: basic.yearlyTotalMutedLabel,
      },
    })
  })
})
