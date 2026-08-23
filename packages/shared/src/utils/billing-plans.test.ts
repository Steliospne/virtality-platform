import { describe, expect, it } from 'vitest'
import {
  FREE_PLAN_PRICE_ID,
  FREE_SUBSCRIPTION_PLAN,
  PRO_SUBSCRIPTION_PLAN,
  PRO_PLAN_MONTHLY_PRICE_ID,
  PRO_PLAN_ANNUAL_PRICE_ID,
  buildFreeTrialSubscriptionCreateParams,
  isFreePlanPriceId,
  isFreeSubscriptionPlan,
  isProPlanPriceId,
} from './billing-plans.ts'

describe('billing plan identifiers', () => {
  it('keeps Free and Pro sandbox Prices distinct', () => {
    expect(FREE_PLAN_PRICE_ID).not.toBe(PRO_PLAN_MONTHLY_PRICE_ID)
    expect(FREE_PLAN_PRICE_ID).not.toBe(PRO_PLAN_ANNUAL_PRICE_ID)
    expect(isFreePlanPriceId(FREE_PLAN_PRICE_ID)).toBe(true)
    expect(isProPlanPriceId(PRO_PLAN_MONTHLY_PRICE_ID)).toBe(true)
    expect(isProPlanPriceId(PRO_PLAN_ANNUAL_PRICE_ID)).toBe(true)
    expect(isFreePlanPriceId(PRO_PLAN_MONTHLY_PRICE_ID)).toBe(false)
    expect(isProPlanPriceId(FREE_PLAN_PRICE_ID)).toBe(false)
  })

  it('recognizes the Free subscription plan name', () => {
    expect(isFreeSubscriptionPlan(FREE_SUBSCRIPTION_PLAN)).toBe(true)
    expect(isFreeSubscriptionPlan(PRO_SUBSCRIPTION_PLAN)).toBe(false)
    expect(isFreeSubscriptionPlan(null)).toBe(false)
  })
})

describe('buildFreeTrialSubscriptionCreateParams', () => {
  it('creates a no-card Free trial without Pro cancel-on-expiry settings', () => {
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
