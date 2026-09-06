import { buildEntitlementStanding } from '../billing/entitlement-clock.ts'
import { hasPendingCyclePlanChange } from '../billing/cycle-plan-change.ts'
import { effectiveAssignedPlanVariant } from '../billing/plan-variant-catalog.ts'
import type {
  AdminCustomerAccessGrantSummary,
  AccessGrantClock,
} from '../billing/access-grant.ts'
import {
  buildAdminCustomerStripeLinks,
  deriveCustomerAccessStatus,
  deriveCustomerBillingStatus,
  mapAdminCustomerSubscriptionHistoryItem,
  pickPrimaryCustomerSubscription,
  sortCustomerSubscriptionHistory,
  type AdminCustomerAuditHistoryItem,
  type AdminCustomerProfile,
  type AdminCustomerSubscriptionRow,
  type StripeDashboardMode,
} from './admin-customer.ts'
import { canChangeAssignedPlanVariant } from './assign-plan-variant.ts'
import { findLivePaidDefaultSubscription } from './admin-customer-billing.ts'

export type AdminCustomerProfileUserRow = {
  id: string
  name: string
  email: string
  role: string | null
  stripeCustomerId: string | null
  assignedDefaultVariant: string | null
  createdAt: Date
}

export type AdminCustomerProfileSubscriptionRow = AdminCustomerSubscriptionRow

export type AdminCustomerProfileAccessGrantContext = {
  openAccessGrantClock: AccessGrantClock | null
  accessGrant: AdminCustomerAccessGrantSummary | null
}

export type BuildAdminCustomerProfileInput = {
  user: AdminCustomerProfileUserRow
  subscriptions: readonly AdminCustomerSubscriptionRow[]
  accessGrantContext: AdminCustomerProfileAccessGrantContext
  auditHistory: AdminCustomerAuditHistoryItem[]
  stripeMode: StripeDashboardMode
  now: Date
}

export function buildAdminCustomerProfile(
  input: BuildAdminCustomerProfileInput,
): AdminCustomerProfile {
  const {
    user,
    subscriptions,
    accessGrantContext,
    auditHistory,
    stripeMode,
    now,
  } = input
  const { openAccessGrantClock, accessGrant } = accessGrantContext

  const subscriptionHistory = sortCustomerSubscriptionHistory(
    subscriptions.map(mapAdminCustomerSubscriptionHistoryItem),
  )
  const primary = pickPrimaryCustomerSubscription(subscriptionHistory)
  const livePaidDefault = findLivePaidDefaultSubscription(subscriptionHistory)
  const standing = buildEntitlementStanding({
    now,
    role: user.role,
    subscriptions: subscriptionHistory,
    accessGate: openAccessGrantClock,
    accessGateEverIssued: accessGrant != null,
  })

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    stripeCustomerId: user.stripeCustomerId,
    assignedDefaultVariant: effectiveAssignedPlanVariant(
      user.assignedDefaultVariant,
    ),
    canChangeAssignedPlanVariant:
      canChangeAssignedPlanVariant(subscriptionHistory),
    createdAt: user.createdAt,
    accessStatus: deriveCustomerAccessStatus({
      now,
      role: user.role,
      subscriptions: subscriptionHistory,
      accessGate: openAccessGrantClock,
    }),
    billingStatus: deriveCustomerBillingStatus(primary),
    hasPendingCyclePlanChange:
      livePaidDefault != null && hasPendingCyclePlanChange(livePaidDefault),
    entitlement: {
      entitled: standing.entitled,
      canLaunchVr: standing.canLaunchVr,
      remainingMs: standing.remainingMs,
      clockEnd: standing.clockEnd,
      billingPathEstablished: standing.billingPathEstablished,
    },
    stripeLinks: buildAdminCustomerStripeLinks({
      stripeCustomerId: user.stripeCustomerId,
      primaryStripeSubscriptionId: primary?.stripeSubscriptionId ?? null,
      stripeMode,
    }),
    subscriptionHistory,
    auditHistory,
    accessGrant,
  }
}
