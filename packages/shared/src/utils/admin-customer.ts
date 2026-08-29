import type { AdminCustomerBillingSnapshot } from './admin-customer-access.ts'
import {
  isFreeSubscriptionPlan,
  isProSubscriptionPlan,
} from './billing/billing-plans.ts'
import { buildEntitlementStanding } from './billing/entitlement-clock.ts'
import { isLiveEntitlementSubscriptionStatus } from './billing/entitlement-extension.ts'

export type CustomerSubscriptionSummary = {
  id: string
  plan: string
  status: string
  trialEnd: Date | null
  periodEnd: Date | null
  endedAt: Date | null
  canceledAt: Date | null
  stripeSubscriptionId?: string | null
  billingInterval?: string | null
  periodStart?: Date | null
  cancelAtPeriodEnd?: boolean | null
  /** Better Auth / Stripe schedule id for a pending Cycle plan change. */
  stripeScheduleId?: string | null
}

export const CUSTOMER_ACCESS_STATUSES = [
  'paid',
  'trialing',
  'free',
  'blocked',
  'admin',
  'tester',
] as const

export type CustomerAccessStatus = (typeof CUSTOMER_ACCESS_STATUSES)[number]

export const CUSTOMER_BILLING_STATUSES = [
  'absent',
  'active',
  'trialing',
  'past_due',
  'canceled',
] as const

export type CustomerBillingStatus = (typeof CUSTOMER_BILLING_STATUSES)[number]

export const CUSTOMER_ACCESS_STATUS_LABELS: Record<
  CustomerAccessStatus,
  string
> = {
  paid: 'Paid',
  trialing: 'Trialing',
  free: 'Free',
  blocked: 'Blocked',
  admin: 'Admin',
  tester: 'Tester',
}

export const CUSTOMER_BILLING_STATUS_LABELS: Record<
  CustomerBillingStatus,
  string
> = {
  absent: 'Absent',
  active: 'Active',
  trialing: 'Trialing',
  past_due: 'Past due',
  canceled: 'Canceled',
}

export type StripeDashboardMode = 'test' | 'live'

export function resolveStripeDashboardMode(
  stripeSecretKey: string | null | undefined,
): StripeDashboardMode {
  return stripeSecretKey?.startsWith('sk_test_') ? 'test' : 'live'
}

export function buildStripeCustomerDashboardUrl(
  stripeCustomerId: string,
  mode: StripeDashboardMode,
): string {
  const prefix = mode === 'test' ? '/test' : ''
  return `https://dashboard.stripe.com${prefix}/customers/${stripeCustomerId}`
}

export function buildStripeSubscriptionDashboardUrl(
  stripeSubscriptionId: string,
  mode: StripeDashboardMode,
): string {
  const prefix = mode === 'test' ? '/test' : ''
  return `https://dashboard.stripe.com${prefix}/subscriptions/${stripeSubscriptionId}`
}

export function subscriptionHistorySortInstant(
  subscription: CustomerSubscriptionSummary,
): number {
  const ended =
    subscription.endedAt ??
    subscription.canceledAt ??
    subscription.periodEnd ??
    subscription.trialEnd
  if (ended) return ended.getTime()
  if (isLiveEntitlementSubscriptionStatus(subscription.status)) {
    return Number.MAX_SAFE_INTEGER
  }
  return 0
}

export function sortCustomerSubscriptionHistory<
  T extends CustomerSubscriptionSummary,
>(subscriptions: readonly T[]): T[] {
  return [...subscriptions].sort(
    (left, right) =>
      subscriptionHistorySortInstant(right) -
      subscriptionHistorySortInstant(left),
  )
}

function isLivePaidProSubscription(
  subscription: CustomerSubscriptionSummary,
): boolean {
  return (
    isLiveEntitlementSubscriptionStatus(subscription.status) &&
    isProSubscriptionPlan(subscription.plan)
  )
}

function isLiveSubscription(
  subscription: CustomerSubscriptionSummary,
): boolean {
  return isLiveEntitlementSubscriptionStatus(subscription.status)
}

export function pickPrimaryCustomerSubscription<
  T extends CustomerSubscriptionSummary,
>(subscriptions: readonly T[]): T | null {
  if (subscriptions.length === 0) return null

  const livePaidPro = subscriptions.find(isLivePaidProSubscription)
  if (livePaidPro) return livePaidPro

  const liveSubscription = subscriptions.find(isLiveSubscription)
  if (liveSubscription) return liveSubscription

  return sortCustomerSubscriptionHistory(subscriptions)[0] ?? null
}

export function deriveCustomerBillingStatus(
  primarySubscription: CustomerSubscriptionSummary | null,
): CustomerBillingStatus {
  if (!primarySubscription) return 'absent'

  switch (primarySubscription.status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    default:
      return 'canceled'
  }
}

export function deriveCustomerAccessStatus(input: {
  now: Date
  role: string | null | undefined
  subscriptions: readonly CustomerSubscriptionSummary[]
}): CustomerAccessStatus {
  if (input.role === 'admin') return 'admin'
  if (input.role === 'tester') return 'tester'

  const standing = buildEntitlementStanding({
    now: input.now,
    role: input.role,
    subscriptions: input.subscriptions,
  })
  const primary = pickPrimaryCustomerSubscription(input.subscriptions)

  if (standing.entitled) {
    return primary?.status === 'trialing' ? 'trialing' : 'paid'
  }

  if (
    primary &&
    isFreeSubscriptionPlan(primary.plan) &&
    primary.status === 'active'
  ) {
    return 'free'
  }

  return 'blocked'
}

export type AdminCustomerListItem = {
  userId: string
  name: string
  email: string
  role: string | null
  stripeCustomerId: string | null
  accessStatus: CustomerAccessStatus
  billingStatus: CustomerBillingStatus
  primarySubscriptionId: string | null
  createdAt: Date
}

export type AdminCustomerSubscriptionHistoryItem =
  CustomerSubscriptionSummary & {
    stripeCustomerId: string | null
  }

export type AdminCustomerBillingSnapshotState = AdminCustomerBillingSnapshot

export type AdminCustomerAuditHistoryItem = {
  id: string
  actorUserId: string
  actorName: string
  actorEmail: string
  action: string
  reason: string
  outcome: string
  stripeOperationId: string | null
  beforeBillingState: AdminCustomerBillingSnapshotState | null
  afterBillingState: AdminCustomerBillingSnapshotState | null
  createdAt: Date
}

export function mapAdminCustomerAuditHistoryItem(row: {
  id: string
  actorUserId: string
  actorName: string
  actorEmail: string
  action: string
  reason: string
  outcome: string
  stripeOperationId: string | null
  beforeBillingState: unknown
  afterBillingState: unknown
  createdAt: Date
}): AdminCustomerAuditHistoryItem {
  return {
    id: row.id,
    actorUserId: row.actorUserId,
    actorName: row.actorName,
    actorEmail: row.actorEmail,
    action: row.action,
    reason: row.reason,
    outcome: row.outcome,
    stripeOperationId: row.stripeOperationId,
    beforeBillingState:
      row.beforeBillingState as AdminCustomerBillingSnapshot | null,
    afterBillingState:
      row.afterBillingState as AdminCustomerBillingSnapshot | null,
    createdAt: row.createdAt,
  }
}

export type AdminCustomerProfile = {
  userId: string
  name: string
  email: string
  role: string | null
  stripeCustomerId: string | null
  /** Effective Assigned Variant (`basic` when storage is null). */
  assignedProVariant: string
  /** False when live paid Pro blocks reassignment. */
  canChangeAssignedProVariant: boolean
  createdAt: Date
  accessStatus: CustomerAccessStatus
  billingStatus: CustomerBillingStatus
  /**
   * True when the live paid Pro seat has a queued Cycle plan change
   * (`stripeScheduleId`).
   */
  hasPendingCyclePlanChange: boolean
  entitlement: {
    entitled: boolean
    canLaunchVr: boolean
    remainingMs: number
    clockEnd: Date | null
    billingPathEstablished: boolean
  }
  stripeLinks: {
    customerUrl: string | null
    primarySubscriptionUrl: string | null
  }
  subscriptionHistory: AdminCustomerSubscriptionHistoryItem[]
  auditHistory: AdminCustomerAuditHistoryItem[]
}
