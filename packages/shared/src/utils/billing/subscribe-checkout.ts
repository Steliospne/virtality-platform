/**
 * Console Subscribe routing: live Free / trialing seats bypass Better Auth's
 * basic `pro` Price resolution and charge the Assigned Variant pair instead.
 */

import {
  FREE_SUBSCRIPTION_PLAN,
  isFreeSubscriptionPlan,
} from './billing-plans.ts'
import { isLiveEntitlementSubscriptionStatus } from './entitlement-extension.ts'

export type AssignedVariantSubscribeCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; message: string }

/** True when Subscribe must use Assigned Variant checkout, not basic `pro`. */
export function shouldRouteSubscribeCheckoutViaAssignedVariant(input: {
  plan: string | null | undefined
  status: string | null | undefined
}): boolean {
  return (
    isFreeSubscriptionPlan(input.plan) &&
    isLiveEntitlementSubscriptionStatus(input.status ?? '')
  )
}

export { FREE_SUBSCRIPTION_PLAN }
