/**
 * Applies an Access Code's baked-in Plan Variant on redemption. Shares the
 * live-paid-subscription guard and resolution rules with manual Adminboard
 * assignment (`assignPlanVariantForCustomer`), but writes no reason and no
 * `AdminCustomerAudit` row — the code itself is the record of intent.
 */

import {
  canChangeAssignedPlanVariant,
  sparseAssignedPlanVariantWrite,
} from '../admin-customer/assign-plan-variant.ts'
import { type AdminCustomerBillingSubscriptionRow } from '../admin-customer/admin-customer-billing.ts'
import {
  resolvePlanVariantPair,
  type PlanVariantCatalog,
} from './plan-variant-catalog.ts'

export type AccessCodeVariantStore = {
  findTargetUser: (userId: string) => Promise<{ id: string } | null>
  listSubscriptions: (
    userId: string,
  ) => Promise<AdminCustomerBillingSubscriptionRow[]>
  updateAssignedPlanVariant: (
    userId: string,
    variantName: string | null,
  ) => Promise<void>
}

export type AccessCodeVariantOutcome = 'applied' | 'blocked' | 'unavailable'

/**
 * `blocked` mirrors the manual-assignment live-paid guard; `unavailable`
 * covers a variant name that no longer resolves to a complete monthly+yearly
 * Price pair in the catalog. Neither case writes anything.
 */
export async function applyAccessCodeVariant(
  store: AccessCodeVariantStore,
  catalog: PlanVariantCatalog,
  input: { userId: string; variantName: string },
): Promise<AccessCodeVariantOutcome> {
  const user = await store.findTargetUser(input.userId)
  if (!user) return 'unavailable'

  const subscriptions = await store.listSubscriptions(user.id)
  if (!canChangeAssignedPlanVariant(subscriptions)) return 'blocked'

  const resolved = resolvePlanVariantPair(catalog, input.variantName)
  if (!resolved.ok) return 'unavailable'

  const sparseValue = sparseAssignedPlanVariantWrite(resolved.pair.name)
  await store.updateAssignedPlanVariant(user.id, sparseValue)
  return 'applied'
}
