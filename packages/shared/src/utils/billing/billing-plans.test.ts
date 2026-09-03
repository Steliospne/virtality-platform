import { describe, expect, it } from 'vitest'
import {
  FREE_PLAN_PRICE_ID,
  FREE_SUBSCRIPTION_PLAN,
  DEFAULT_SUBSCRIPTION_PLAN,
  DEFAULT_PLAN_MONTHLY_PRICE_ID,
  DEFAULT_PLAN_ANNUAL_PRICE_ID,
  buildFreeTrialSubscriptionCreateParams,
  isFreePlanPriceId,
  isFreeSubscriptionPlan,
  isDefaultPlanPriceId,
  shouldScheduleSubscriptionChangeAtPeriodEnd,
} from './billing-plans.ts'

describe('billing plan identifiers', () => {
  it('keeps Free and Default sandbox Prices distinct', () => {
    expect(FREE_PLAN_PRICE_ID).not.toBe(DEFAULT_PLAN_MONTHLY_PRICE_ID)
    expect(FREE_PLAN_PRICE_ID).not.toBe(DEFAULT_PLAN_ANNUAL_PRICE_ID)
    expect(isFreePlanPriceId(FREE_PLAN_PRICE_ID)).toBe(true)
    expect(isDefaultPlanPriceId(DEFAULT_PLAN_MONTHLY_PRICE_ID)).toBe(true)
    expect(isDefaultPlanPriceId(DEFAULT_PLAN_ANNUAL_PRICE_ID)).toBe(true)
    expect(isFreePlanPriceId(DEFAULT_PLAN_MONTHLY_PRICE_ID)).toBe(false)
    expect(isDefaultPlanPriceId(FREE_PLAN_PRICE_ID)).toBe(false)
  })

  it('recognizes the Free subscription plan name', () => {
    expect(isFreeSubscriptionPlan(FREE_SUBSCRIPTION_PLAN)).toBe(true)
    expect(isFreeSubscriptionPlan(DEFAULT_SUBSCRIPTION_PLAN)).toBe(false)
    expect(isFreeSubscriptionPlan(null)).toBe(false)
  })

  it('schedules only paid Default plan changes at period end', () => {
    expect(
      shouldScheduleSubscriptionChangeAtPeriodEnd(DEFAULT_SUBSCRIPTION_PLAN),
    ).toBe(true)
    expect(
      shouldScheduleSubscriptionChangeAtPeriodEnd(FREE_SUBSCRIPTION_PLAN),
    ).toBe(false)
    expect(shouldScheduleSubscriptionChangeAtPeriodEnd(null)).toBe(false)
    expect(shouldScheduleSubscriptionChangeAtPeriodEnd(undefined)).toBe(false)
  })
})

describe('buildFreeTrialSubscriptionCreateParams', () => {
  it('creates a no-card Free trial without Default cancel-on-expiry settings', () => {
    const params = buildFreeTrialSubscriptionCreateParams({
      customerId: 'cus_1',
      priceId: FREE_PLAN_PRICE_ID,
      trialPeriodDays: 14,
      metadata: { trialRedeemCodeId: '42' },
    })

    expect(params).toEqual({
      customer: 'cus_1',
      items: [{ price: FREE_PLAN_PRICE_ID }],
      trial_period_days: 14,
      metadata: {
        plan: FREE_SUBSCRIPTION_PLAN,
        trialRedeemCodeId: '42',
      },
    })
    expect(params).not.toHaveProperty('trial_settings')
  })
})
