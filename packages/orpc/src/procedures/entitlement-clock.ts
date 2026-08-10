import type { PrismaClient } from '@virtality/db'
import {
  buildEntitlementStanding,
  type EntitlementStanding,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'

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

  const subscriptions = await input.prisma.subscription.findMany({
    where: { OR: orFilters },
    select: {
      status: true,
      trialEnd: true,
      periodEnd: true,
    },
  })

  return buildEntitlementStanding({
    now: input.now ?? new Date(),
    role: input.role,
    subscriptions,
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
