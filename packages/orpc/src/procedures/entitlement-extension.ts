import { ORPCError } from '@orpc/server'
import { extendLiveEntitlementClockAction } from '@virtality/auth'
import type { PrismaClient } from '@virtality/db'
import {
  extendEntitlementClockInputSchema,
  type ExtendableSeatListItem,
} from '@virtality/shared/types'
import {
  EntitlementExtensionNotLiveError,
  EntitlementExtensionValidationError,
  LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES,
  isLiveEntitlementSubscriptionStatus,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'

function clockEndForLiveStatus(
  status: 'trialing' | 'active',
  trialEnd: Date | null,
  periodEnd: Date | null,
): Date | null {
  return status === 'trialing' ? trialEnd : periodEnd
}

async function listExtendableSeats(
  prisma: PrismaClient,
): Promise<ExtendableSeatListItem[]> {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: [...LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES] },
      stripeSubscriptionId: { not: null },
    },
    orderBy: { id: 'desc' },
  })

  const byUser = new Map<string, (typeof subscriptions)[number]>()
  for (const subscription of subscriptions) {
    if (!byUser.has(subscription.referenceId)) {
      byUser.set(subscription.referenceId, subscription)
    }
  }

  const userIds = [...byUser.keys()]
  if (userIds.length === 0) return []

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, deletedAt: null },
    select: { id: true, name: true, email: true },
  })
  const usersById = new Map(users.map((user) => [user.id, user]))

  const seats: ExtendableSeatListItem[] = []
  for (const [userId, subscription] of byUser) {
    const user = usersById.get(userId)
    if (!user || !subscription.stripeSubscriptionId) continue
    if (!isLiveEntitlementSubscriptionStatus(subscription.status)) continue

    seats.push({
      userId: user.id,
      name: user.name,
      email: user.email,
      subscriptionStatus: subscription.status,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      clockEnd: clockEndForLiveStatus(
        subscription.status,
        subscription.trialEnd,
        subscription.periodEnd,
      ),
    })
  }

  return seats.sort((left, right) => left.email.localeCompare(right.email))
}

function throwEntitlementExtensionOrpcError(error: unknown): never {
  if (
    error instanceof EntitlementExtensionValidationError ||
    error instanceof EntitlementExtensionNotLiveError
  ) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }
  if (error instanceof Error) {
    throw new ORPCError('BAD_REQUEST', {
      message: `Stripe Extension failed: ${error.message}`,
    })
  }
  throw error
}

const listSeats = authed
  .route({ path: '/entitlement-extension/list-seats', method: 'GET' })
  .handler(async ({ context }) => listExtendableSeats(context.prisma))

const extend = authed
  .route({ path: '/entitlement-extension/extend', method: 'POST' })
  .input(extendEntitlementClockInputSchema)
  .handler(async ({ context, input }) => {
    try {
      return await extendLiveEntitlementClockAction(context.prisma, {
        userId: input.userId,
        amount: input.amount,
        unit: input.unit,
        actorUserId: context.user.id,
      })
    } catch (error) {
      throwEntitlementExtensionOrpcError(error)
    }
  })

export const entitlementExtension = {
  listSeats,
  extend,
}
