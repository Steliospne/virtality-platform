/**
 * Stripe plan names and sandbox Price identifiers for entitlement and trial
 * acquisition. Pro Prices are also declared in `@virtality/auth` for Better
 * Auth Checkout; Free is never rendered in Profile Billing.
 */

export const FREE_SUBSCRIPTION_PLAN = 'free' as const
export const PRO_SUBSCRIPTION_PLAN = 'pro' as const

/**
 * Canonical sandbox Free monthly Price on a distinct Product
 * (`lookup_key: free_monthly`, €0 recurring).
 */
export const FREE_PLAN_PRICE_ID = 'price_1U3f2h4Fc2DAAhEfFr33Mn0' as const

/** Canonical sandbox Pro monthly Price (`lookup_key: pro_monthly`). */
export const PRO_PLAN_MONTHLY_PRICE_ID =
  'price_1SeVrm4Fc2DAAhEfIWIRZ2v9' as const

export function isFreeSubscriptionPlan(
  plan: string | null | undefined,
): boolean {
  return plan === FREE_SUBSCRIPTION_PLAN
}

export function isProSubscriptionPlan(
  plan: string | null | undefined,
): boolean {
  return plan === PRO_SUBSCRIPTION_PLAN
}

export function isFreePlanPriceId(priceId: string): boolean {
  return priceId === FREE_PLAN_PRICE_ID
}

export function isProPlanPriceId(priceId: string): boolean {
  return priceId === PRO_PLAN_MONTHLY_PRICE_ID
}

export type FreeTrialSubscriptionCreateInput = {
  customerId: string
  priceId: string
  trialPeriodDays: number
  metadata: { trialRedeemCodeId: string }
}

/**
 * Stripe `subscriptions.create` shape for a no-card Free Trial Subscription.
 * Omits Pro-only `missing_payment_method: cancel` so the seat stays on Free
 * after trial expiry.
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

export type FreeTimedTrialSubscriptionCreateInput = {
  customerId: string
  priceId: string
  trialEndUnix: number
  metadata: Record<string, string>
}

/**
 * Stripe `subscriptions.create` shape for a no-card Free Trial Subscription
 * with an absolute `trial_end` (admin timed trial grants).
 */
export function buildFreeTimedTrialSubscriptionCreateParams(
  input: FreeTimedTrialSubscriptionCreateInput,
) {
  return {
    customer: input.customerId,
    items: [{ price: input.priceId }],
    trial_end: input.trialEndUnix,
    metadata: {
      plan: FREE_SUBSCRIPTION_PLAN,
      ...input.metadata,
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
