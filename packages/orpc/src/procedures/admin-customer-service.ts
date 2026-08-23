import type { PrismaClient } from '@virtality/db'
import {
  buildEntitlementStanding,
  buildStripeCustomerDashboardUrl,
  buildStripeSubscriptionDashboardUrl,
  deriveCustomerAccessStatus,
  deriveCustomerBillingStatus,
  pickPrimaryCustomerSubscription,
  resolveStripeDashboardMode,
  sortCustomerSubscriptionHistory,
  type AdminCustomerAuditHistoryItem,
  type AdminCustomerBillingSnapshotState,
  type AdminCustomerListItem,
  type AdminCustomerProfile,
  type AdminCustomerSubscriptionHistoryItem,
  type StripeDashboardMode,
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

  return rows.map((row) => ({
    id: row.id,
    actorUserId: row.actorUserId,
    actorName: row.actorUser.name,
    actorEmail: row.actorUser.email,
    action: row.action,
    reason: row.reason,
    outcome: row.outcome,
    stripeOperationId: row.stripeOperationId,
    beforeBillingState:
      row.beforeBillingState as AdminCustomerBillingSnapshotState | null,
    afterBillingState:
      row.afterBillingState as AdminCustomerBillingSnapshotState | null,
    createdAt: row.createdAt,
  }))
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
  const standing = buildEntitlementStanding({
    now,
    role: user.role,
    subscriptions: subscriptionHistory,
  })

  const auditRows = await listAdminCustomerAuditHistory(prisma, user.id)
  const auditHistory: AdminCustomerAuditHistoryItem[] = auditRows

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    stripeCustomerId: user.stripeCustomerId,
    createdAt: user.createdAt,
    accessStatus: deriveCustomerAccessStatus({
      now,
      role: user.role,
      subscriptions: subscriptionHistory,
    }),
    billingStatus: deriveCustomerBillingStatus(primary),
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
  }
}

export function resolveAdminCustomerStripeMode(
  env: NodeJS.ProcessEnv = process.env,
): StripeDashboardMode {
  return resolveStripeDashboardMode(env.STRIPE_SECRET_KEY)
}
