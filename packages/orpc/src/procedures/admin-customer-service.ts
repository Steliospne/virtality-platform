import type { PrismaClient } from '@virtality/db'
import {
  buildEntitlementStanding,
  buildStripeCustomerDashboardUrl,
  buildStripeSubscriptionDashboardUrl,
  canChangeAssignedPlanVariant,
  deriveCustomerAccessStatus,
  deriveCustomerBillingStatus,
  effectiveAssignedPlanVariant,
  findLivePaidDefaultSubscription,
  hasPendingCyclePlanChange,
  mapAdminCustomerTrialGrantSummary,
  pickPrimaryCustomerSubscription,
  resolveStripeDashboardMode,
  sortCustomerSubscriptionHistory,
  TRIAL_GRANT_OPEN_STATUSES,
  mapAdminCustomerAuditHistoryItem,
  type AdminCustomerAuditHistoryItem,
  type AdminCustomerBillingSnapshot,
  type AdminCustomerListItem,
  type AdminCustomerProfile,
  type AdminCustomerSubscriptionHistoryItem,
  type AdminCustomerTrialGrantSummary,
  type StripeDashboardMode,
  type TrialGrantClock,
} from '@virtality/shared/utils'

type CustomerUserRow = {
  id: string
  name: string
  email: string
  role: string | null
  stripeCustomerId: string | null
  createdAt: Date
}

type CustomerSubscriptionRow = {
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

async function listAdminCustomerAuditHistory(
  prisma: PrismaClient,
  userId: string,
): Promise<AdminCustomerAuditHistoryItem[]> {
  const rows = await prisma.adminCustomerAudit.findMany({
    where: { targetUserId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      actorUser: {
        select: { name: true, email: true },
      },
    },
  })

  return rows.map((row) =>
    mapAdminCustomerAuditHistoryItem({
      id: row.id,
      actorUserId: row.actorUserId,
      actorName: row.actorUser.name,
      actorEmail: row.actorUser.email,
      action: row.action,
      reason: row.reason,
      outcome: row.outcome,
      stripeOperationId: row.stripeOperationId,
      beforeBillingState: row.beforeBillingState,
      afterBillingState: row.afterBillingState,
      createdAt: row.createdAt,
    }),
  )
}

function mapSubscriptionHistoryItem(
  subscription: CustomerSubscriptionRow,
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

function buildCustomerListItem(input: {
  user: CustomerUserRow
  subscriptions: readonly CustomerSubscriptionRow[]
  now: Date
}): AdminCustomerListItem {
  const subscriptionSummaries = input.subscriptions.map(
    mapSubscriptionHistoryItem,
  )
  const primary = pickPrimaryCustomerSubscription(subscriptionSummaries)

  return {
    userId: input.user.id,
    name: input.user.name,
    email: input.user.email,
    role: input.user.role,
    stripeCustomerId: input.user.stripeCustomerId,
    accessStatus: deriveCustomerAccessStatus({
      now: input.now,
      role: input.user.role,
      subscriptions: subscriptionSummaries,
    }),
    billingStatus: deriveCustomerBillingStatus(primary),
    primarySubscriptionId: primary?.id ?? null,
    createdAt: input.user.createdAt,
  }
}

export async function listAdminCustomers(
  prisma: PrismaClient,
  input: { now?: Date } = {},
): Promise<AdminCustomerListItem[]> {
  const now = input.now ?? new Date()

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      stripeCustomerId: true,
      createdAt: true,
    },
    orderBy: { email: 'asc' },
  })

  if (users.length === 0) return []

  const userIds = users.map((user) => user.id)
  const subscriptions = await prisma.subscription.findMany({
    where: { referenceId: { in: userIds } },
  })

  const subscriptionsByUser = new Map<string, CustomerSubscriptionRow[]>()
  for (const subscription of subscriptions) {
    const existing = subscriptionsByUser.get(subscription.referenceId) ?? []
    existing.push(subscription)
    subscriptionsByUser.set(subscription.referenceId, existing)
  }

  return users.map((user) =>
    buildCustomerListItem({
      user,
      subscriptions: subscriptionsByUser.get(user.id) ?? [],
      now,
    }),
  )
}

const ADMIN_CUSTOMER_TRIAL_GRANT_SELECT = {
  id: true,
  userId: true,
  status: true,
  trialStart: true,
  trialEnd: true,
  createdAt: true,
} as const

async function loadAdminCustomerTrialGrantContext(
  prisma: PrismaClient,
  userId: string,
  now: Date,
): Promise<{
  openTrialGrantClock: TrialGrantClock | null
  trialGrant: AdminCustomerTrialGrantSummary | null
}> {
  const openGrant = await prisma.trialGrant.findFirst({
    where: {
      userId,
      status: { in: [...TRIAL_GRANT_OPEN_STATUSES] },
    },
    orderBy: { createdAt: 'desc' },
    select: ADMIN_CUSTOMER_TRIAL_GRANT_SELECT,
  })

  const displayGrant =
    openGrant ??
    (await prisma.trialGrant.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: ADMIN_CUSTOMER_TRIAL_GRANT_SELECT,
    }))

  if (!displayGrant) {
    return { openTrialGrantClock: null, trialGrant: null }
  }

  return {
    openTrialGrantClock: openGrant
      ? {
          status: openGrant.status as TrialGrantClock['status'],
          trialStart: openGrant.trialStart,
          trialEnd: openGrant.trialEnd,
        }
      : null,
    trialGrant: mapAdminCustomerTrialGrantSummary({
      now,
      grant: displayGrant,
    }),
  }
}

export async function getAdminCustomerProfile(
  prisma: PrismaClient,
  input: {
    userId: string
    stripeMode: StripeDashboardMode
    now?: Date
  },
): Promise<AdminCustomerProfile | null> {
  const now = input.now ?? new Date()

  const user = await prisma.user.findFirst({
    where: { id: input.userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      stripeCustomerId: true,
      assignedDefaultVariant: true,
      createdAt: true,
    },
  })

  if (!user) return null

  const subscriptions = await prisma.subscription.findMany({
    where: { referenceId: user.id },
  })

  const subscriptionHistory = sortCustomerSubscriptionHistory(
    subscriptions.map(mapSubscriptionHistoryItem),
  )
  const primary = pickPrimaryCustomerSubscription(subscriptionHistory)
  const livePaidDefault = findLivePaidDefaultSubscription(subscriptionHistory)
  const { openTrialGrantClock, trialGrant } =
    await loadAdminCustomerTrialGrantContext(prisma, user.id, now)
  const standing = buildEntitlementStanding({
    now,
    role: user.role,
    subscriptions: subscriptionHistory,
    trialGrant: openTrialGrantClock,
  })

  const auditHistory = await listAdminCustomerAuditHistory(prisma, user.id)

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
      stripeMode: input.stripeMode,
    }),
    subscriptionHistory,
    auditHistory,
    trialGrant,
  }
}

export function resolveAdminCustomerStripeMode(
  env: NodeJS.ProcessEnv = process.env,
): StripeDashboardMode {
  return resolveStripeDashboardMode(env.STRIPE_SECRET_KEY)
}
