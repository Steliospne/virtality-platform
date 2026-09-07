import type { PrismaClient } from '@virtality/db'
import {
  buildEntitlementStanding,
  ACCESS_GATE_OPEN_STATUSES,
  type EntitlementStanding,
} from '@virtality/shared/utils'
import { z } from 'zod'
import { authed } from '../middleware/auth.ts'

export async function loadAccessGateClockForUser(
  prisma: PrismaClient,
  userId: string,
) {
  return prisma.accessGrant.findFirst({
    where: {
      userId,
      status: { in: [...ACCESS_GATE_OPEN_STATUSES] },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      status: true,
      trialStart: true,
      trialEnd: true,
      hasSeenWelcome: true,
    },
  })
}

export async function userHasAccessGateHistory(
  prisma: PrismaClient,
  userId: string,
): Promise<boolean> {
  const row = await prisma.accessGrant.findFirst({
    where: { userId },
    select: { id: true },
  })
  return row != null
}

/** @deprecated Use `loadAccessGateClockForUser`. */
export const loadAccessGrantClockForUser = loadAccessGateClockForUser

export async function loadEntitlementStandingForSession(input: {
  prisma: PrismaClient
  userId: string
  role: string | null | undefined
  stripeCustomerId: string | null | undefined
  now?: Date
}): Promise<EntitlementStanding> {
  const orFilters: Array<
    { referenceId: string } | { stripeCustomerId: string }
  > = [{ referenceId: input.userId }]
  if (input.stripeCustomerId) {
    orFilters.push({ stripeCustomerId: input.stripeCustomerId })
  }

  const [subscriptions, accessGate, accessGateEverIssued] = await Promise.all([
    input.prisma.subscription.findMany({
      where: { OR: orFilters },
      select: {
        status: true,
        plan: true,
        trialStart: true,
        trialEnd: true,
        periodStart: true,
        periodEnd: true,
        billingInterval: true,
        stripeScheduleId: true,
        cancelAtPeriodEnd: true,
      },
    }),
    loadAccessGateClockForUser(input.prisma, input.userId),
    userHasAccessGateHistory(input.prisma, input.userId),
  ])

  return buildEntitlementStanding({
    now: input.now ?? new Date(),
    role: input.role,
    subscriptions,
    accessGate: accessGate
      ? {
          status: accessGate.status,
          trialStart: accessGate.trialStart,
          trialEnd: accessGate.trialEnd,
        }
      : null,
    accessGateEverIssued,
    accessGateHasSeenWelcome: accessGate?.hasSeenWelcome,
  })
}

const getStanding = authed
  .route({ path: '/entitlement-clock/standing', method: 'GET' })
  .handler(async ({ context }) => {
    return loadEntitlementStandingForSession({
      prisma: context.prisma,
      userId: context.user.id,
      role: context.user.role,
      stripeCustomerId: context.user.stripeCustomerId,
    })
  })

const markTrialWelcomeSeen = authed
  .route({ path: '/entitlement-clock/mark-trial-welcome-seen', method: 'POST' })
  .input(z.object({}))
  .handler(async ({ context }) => {
    await context.prisma.accessGrant.updateMany({
      where: {
        userId: context.user.id,
        status: 'trialing',
        hasSeenWelcome: false,
      },
      data: {
        hasSeenWelcome: true,
        updatedAt: new Date(),
      },
    })
    return { ok: true as const }
  })

export const entitlementClock = {
  getStanding,
  markTrialWelcomeSeen,
}
