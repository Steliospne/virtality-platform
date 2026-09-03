/**
 * Stripe plan names and sandbox Price identifiers for entitlement and trial
 * acquisition. Default Prices are also declared in `@virtality/auth` for
 * Better Auth Checkout; Free is never rendered in Profile Billing.
 */

export const FREE_SUBSCRIPTION_PLAN = 'free' as const
export const DEFAULT_SUBSCRIPTION_PLAN = 'default' as const

/**
 * Canonical sandbox Free monthly Price on a distinct Product
 * (`lookup_key: free_monthly`, €0 recurring).
 */
export const FREE_PLAN_PRICE_ID = 'price_1U7hSd4Fc2DAAhEf1E06qFtt' as const

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

export function isFreePlanPriceId(priceId: string): boolean {
  return priceId === FREE_PLAN_PRICE_ID
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

export type FreeTrialSubscriptionCreateInput = {
  customerId: string
  priceId: string
  trialPeriodDays: number
  metadata: { trialRedeemCodeId: string }
}

/**
 * Stripe `subscriptions.create` shape for a no-card Free Trial Subscription.
 * Omits Default-only `missing_payment_method: cancel` so the seat stays on
 * Free after trial expiry.
 */
export function buildFreeTrialSubscriptionCreateParams(
  input: FreeTrialSubscriptionCreateInput,
) {
  return {
    customer: input.customerId,
    items: [{ price: input.priceId }],
    trial_period_days: input.trialPeriodDays,
    metadata: {
      plan: FREE_SUBSCRIPTION_PLAN,
      trialRedeemCodeId: input.metadata.trialRedeemCodeId,
    },
  }
}

export type PermanentFreeSubscriptionCreateInput = {
  customerId: string
  priceId: string
  metadata: Record<string, string>
}

/** Stripe `subscriptions.create` shape for a permanent Free subscription (no trial). */
export function buildPermanentFreeSubscriptionCreateParams(
  input: PermanentFreeSubscriptionCreateInput,
) {
  return {
    customer: input.customerId,
    items: [{ price: input.priceId }],
    metadata: {
      plan: FREE_SUBSCRIPTION_PLAN,
      ...input.metadata,
    },
  }
}
