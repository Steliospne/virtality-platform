export type AdminCustomerBillingSnapshot = {
  role: string | null
  stripeCustomerId: string | null
  primaryPlan: string | null
  primaryStatus: string | null
  stripeSubscriptionId: string | null
  /** Effective Assigned Variant name (`basic` when storage is null). */
  assignedDefaultVariant: string | null
}
export function billingSnapshotFromSubscription(input: {
  role: string | null
  stripeCustomerId: string | null
  assignedDefaultVariant?: string | null
  subscription: {
    plan: string
    status: string
    stripeSubscriptionId: string | null
  } | null
}): AdminCustomerBillingSnapshot {
  return {
    role: input.role,
    stripeCustomerId: input.stripeCustomerId,
    primaryPlan: input.subscription?.plan ?? null,
    primaryStatus: input.subscription?.status ?? null,
    stripeSubscriptionId: input.subscription?.stripeSubscriptionId ?? null,
    assignedDefaultVariant: input.assignedDefaultVariant ?? null,
  }
}
