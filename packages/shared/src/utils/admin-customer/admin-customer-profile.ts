import { buildEntitlementStanding } from '../billing/entitlement-clock.ts'
import { hasPendingCyclePlanChange } from '../billing/cycle-plan-change.ts'
import { effectiveAssignedPlanVariant } from '../billing/plan-variant-catalog.ts'
import type { TrialGrantClock } from '../billing/trial-grant.ts'
import type { AdminCustomerTrialGrantSummary } from '../billing/trial-grant.ts'
import {
  buildStripeCustomerDashboardUrl,
  buildStripeSubscriptionDashboardUrl,
  deriveCustomerAccessStatus,
  deriveCustomerBillingStatus,
  pickPrimaryCustomerSubscription,
  sortCustomerSubscriptionHistory,
  type AdminCustomerAuditHistoryItem,
  type AdminCustomerProfile,
  type AdminCustomerSubscriptionHistoryItem,
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

export type AdminCustomerProfileSubscriptionRow = {
  id: string
  plan: string
  referenceId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  status: string
  periodStart: Date | null
  periodEnd: Date | null
  cancelAtPeriodEnd: boolean | null
  canceledAt: Date | null
  endedAt: Date | null
  trialStart: Date | null
  trialEnd: Date | null
  billingInterval: string | null
  stripeScheduleId: string | null
}

export type AdminCustomerProfileTrialGrantContext = {
  openTrialGrantClock: TrialGrantClock | null
  trialGrant: AdminCustomerTrialGrantSummary | null
}

function mapSubscriptionHistoryItem(
  subscription: AdminCustomerProfileSubscriptionRow,
): AdminCustomerSubscriptionHistoryItem {
  return {
    id: subscription.id,
    plan: subscription.plan,
    status: subscription.status,
    trialEnd: subscription.trialEnd,
    periodEnd: subscription.periodEnd,
    endedAt: subscription.endedAt,
    canceledAt: subscription.canceledAt,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    billingInterval: subscription.billingInterval,
    periodStart: subscription.periodStart,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    stripeScheduleId: subscription.stripeScheduleId ?? null,
    stripeCustomerId: subscription.stripeCustomerId,
  }
}

function buildStripeLinks(input: {
  stripeCustomerId: string | null
  primaryStripeSubscriptionId: string | null
  stripeMode: StripeDashboardMode
}) {
  return {
    customerUrl: input.stripeCustomerId
      ? buildStripeCustomerDashboardUrl(
          input.stripeCustomerId,
          input.stripeMode,
        )
      : null,
    primarySubscriptionUrl: input.primaryStripeSubscriptionId
      ? buildStripeSubscriptionDashboardUrl(
          input.primaryStripeSubscriptionId,
          input.stripeMode,
        )
      : null,
  }
}

export function buildAdminCustomerProfile(input: {
  user: AdminCustomerProfileUserRow
  subscriptions: readonly AdminCustomerProfileSubscriptionRow[]
  trialGrantContext: AdminCustomerProfileTrialGrantContext
  auditHistory: AdminCustomerAuditHistoryItem[]
  stripeMode: StripeDashboardMode
  now: Date
}): AdminCustomerProfile {
  const {
    user,
    subscriptions,
    trialGrantContext,
    auditHistory,
    stripeMode,
    now,
  } = input
  const { openTrialGrantClock, trialGrant } = trialGrantContext

  const subscriptionHistory = sortCustomerSubscriptionHistory(
    subscriptions.map(mapSubscriptionHistoryItem),
  )
  const primary = pickPrimaryCustomerSubscription(subscriptionHistory)
  const livePaidDefault = findLivePaidDefaultSubscription(subscriptionHistory)
  const standing = buildEntitlementStanding({
    now,
    role: user.role,
    subscriptions: subscriptionHistory,
    trialGrant: openTrialGrantClock,
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
    }),
    billingStatus: deriveCustomerBillingStatus(primary),
    hasPendingCyclePlanChange: livePaidDefault
      ? hasPendingCyclePlanChange(livePaidDefault)
      : false,
    entitlement: {
      entitled: standing.entitled,
      canLaunchVr: standing.canLaunchVr,
      remainingMs: standing.remainingMs,
      clockEnd: standing.clockEnd,
      billingPathEstablished: standing.billingPathEstablished,
    },
    stripeLinks: buildStripeLinks({
      stripeCustomerId: user.stripeCustomerId,
      primaryStripeSubscriptionId: primary?.stripeSubscriptionId ?? null,
      stripeMode,
    }),
    subscriptionHistory,
    auditHistory,
    trialGrant,
  }
}
