import type { PrismaClient } from '@virtality/db'
import {
  buildEntitlementStanding,
  TRIAL_GRANT_OPEN_STATUSES,
  type EntitlementStanding,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'

export async function loadTrialGrantClockForUser(
  prisma: PrismaClient,
  userId: string,
) {
  return prisma.trialGrant.findFirst({
    where: {
      userId,
      status: { in: [...TRIAL_GRANT_OPEN_STATUSES] },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      status: true,
      trialStart: true,
      trialEnd: true,
    },
  })
}

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

  const [subscriptions, trialGrant] = await Promise.all([
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
    loadTrialGrantClockForUser(input.prisma, input.userId),
  ])

  return buildEntitlementStanding({
    now: input.now ?? new Date(),
    role: input.role,
    subscriptions,
    trialGrant,
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

export const entitlementClock = {
  getStanding,
}
