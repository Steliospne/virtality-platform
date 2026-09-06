import { describe, expect, it } from 'vitest'
import {
  FREE_SUBSCRIPTION_PLAN,
  DEFAULT_SUBSCRIPTION_PLAN,
  DEFAULT_PLAN_MONTHLY_PRICE_ID,
  DEFAULT_PLAN_ANNUAL_PRICE_ID,
  isFreeSubscriptionPlan,
  isDefaultPlanPriceId,
  shouldScheduleSubscriptionChangeAtPeriodEnd,
} from './billing-plans.ts'

describe('billing plan identifiers', () => {
  it('recognizes Default sandbox Price ids', () => {
    expect(isDefaultPlanPriceId(DEFAULT_PLAN_MONTHLY_PRICE_ID)).toBe(true)
    expect(isDefaultPlanPriceId(DEFAULT_PLAN_ANNUAL_PRICE_ID)).toBe(true)
    expect(isDefaultPlanPriceId('price_unknown')).toBe(false)
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
