import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import {
  extendEntitlementClockInputSchema,
  type ExtendableSeatListItem,
  type ExtendableSeatSubscriptionStatus,
} from '@virtality/shared/types'
import {
  EntitlementExtensionAlreadyEntitledError,
  EntitlementExtensionMissingCustomerError,
  EntitlementExtensionNotLiveError,
  EntitlementExtensionValidationError,
  isLiveEntitlementSubscriptionStatus,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'
import { adminEntitlementClockRuntime } from './admin-entitlement-clock-runtime.ts'

function clockEndForStatus(
  status: string,
  trialEnd: Date | null,
  periodEnd: Date | null,
): Date | null {
  if (status === 'trialing') return trialEnd
  if (status === 'active') return periodEnd
  return trialEnd ?? periodEnd
}

function classifySeatStatus(
  liveStatus: string | undefined,
  latestNonLiveStatus: string | undefined,
): ExtendableSeatSubscriptionStatus {
  if (liveStatus && isLiveEntitlementSubscriptionStatus(liveStatus)) {
    return liveStatus
  }
  if (latestNonLiveStatus === 'canceled') return 'canceled'
  if (latestNonLiveStatus) return 'expired'
  return 'never_entitled'
}

async function listExtendableSeats(
  prisma: PrismaClient,
): Promise<ExtendableSeatListItem[]> {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      stripeCustomerId: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { email: 'asc' },
  })
  if (users.length === 0) return []

  const userIds = users.map((user) => user.id)
  const subscriptions = await prisma.subscription.findMany({
    where: { referenceId: { in: userIds } },
    orderBy: { id: 'desc' },
  })

  const liveByUser = new Map<string, (typeof subscriptions)[number]>()
  const latestByUser = new Map<string, (typeof subscriptions)[number]>()
  for (const subscription of subscriptions) {
    if (!latestByUser.has(subscription.referenceId)) {
      latestByUser.set(subscription.referenceId, subscription)
    }
    if (
      isLiveEntitlementSubscriptionStatus(subscription.status) &&
      subscription.stripeSubscriptionId &&
      !liveByUser.has(subscription.referenceId)
    ) {
      liveByUser.set(subscription.referenceId, subscription)
    }
  }

  const seats: ExtendableSeatListItem[] = []
  for (const user of users) {
    const live = liveByUser.get(user.id)
    const latest = latestByUser.get(user.id)
    const subscriptionStatus = classifySeatStatus(
      live?.status,
      live ? undefined : latest?.status,
    )
    const source = live ?? latest

    seats.push({
      userId: user.id,
      name: user.name,
      email: user.email,
      subscriptionStatus,
      stripeSubscriptionId: source?.stripeSubscriptionId ?? null,
      clockEnd: source
        ? clockEndForStatus(source.status, source.trialEnd, source.periodEnd)
        : null,
      // liveByUser only includes trialing|active seats with a Stripe sub id
      extensionMode: live ? 'update' : 'create',
    })
  }

  return seats
}

function throwEntitlementExtensionOrpcError(error: unknown): never {
  if (
    error instanceof EntitlementExtensionValidationError ||
    error instanceof EntitlementExtensionNotLiveError ||
    error instanceof EntitlementExtensionMissingCustomerError ||
    error instanceof EntitlementExtensionAlreadyEntitledError
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
      const clock = adminEntitlementClockRuntime(context)
      return await clock.extendEntitlementClock({
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
