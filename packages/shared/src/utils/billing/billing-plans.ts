/**
 * Stripe plan names and sandbox Price identifiers for entitlement and billing.
 * Default Prices are also declared in `@virtality/auth` for Better Auth Checkout.
 * Legacy Free subscription rows may still exist in Stripe; Access Gates own
 * pre-conversion access and no Free Price is registered in the catalog.
 */

export const FREE_SUBSCRIPTION_PLAN = 'free' as const
export const DEFAULT_SUBSCRIPTION_PLAN = 'default' as const

/**
 * Canonical sandbox Default monthly Price (`lookup_key: basic_monthly`;
 * legacy `pro_monthly` until Stripe rename).
 */
export const DEFAULT_PLAN_MONTHLY_PRICE_ID =
  'price_1SeVrm4Fc2DAAhEfIWIRZ2v9' as const

/**
 * Canonical sandbox Default yearly Price on the same Product
 * (`lookup_key: basic_yearly`; legacy `pro_yearly` until Stripe rename).
 */
export const DEFAULT_PLAN_ANNUAL_PRICE_ID =
  'price_1U3f2g4Fc2DAAhEfk5EkH3u1' as const

export const SUPPORTED_DEFAULT_PLAN_PRICE_IDS = [
  DEFAULT_PLAN_MONTHLY_PRICE_ID,
  DEFAULT_PLAN_ANNUAL_PRICE_ID,
] as const

export function isFreeSubscriptionPlan(
  plan: string | null | undefined,
): boolean {
  return plan === FREE_SUBSCRIPTION_PLAN
}

export function isDefaultSubscriptionPlan(
  plan: string | null | undefined,
): boolean {
  return plan === DEFAULT_SUBSCRIPTION_PLAN
}

/**
 * Paid Default monthly ↔ yearly switches apply at the next billing cycle.
 * Free → Paid charges immediately (Checkout / immediate upgrade).
 */
export function shouldScheduleSubscriptionChangeAtPeriodEnd(
  currentPlan: string | null | undefined,
): boolean {
  return isDefaultSubscriptionPlan(currentPlan)
}

export function isDefaultPlanPriceId(priceId: string): boolean {
  return (SUPPORTED_DEFAULT_PLAN_PRICE_IDS as readonly string[]).includes(
    priceId,
  )
}

export function formatDefaultPlanPriceLabel(priceId: string): string {
  if (priceId === DEFAULT_PLAN_MONTHLY_PRICE_ID) return 'Default monthly'
  if (priceId === DEFAULT_PLAN_ANNUAL_PRICE_ID) return 'Default yearly'
  return priceId
}
