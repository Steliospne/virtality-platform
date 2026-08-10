import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  extendLiveEntitlementClock,
  LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES,
  type EntitlementExtensionStore,
  type EntitlementExtensionStripeGateway,
  type ExtendLiveEntitlementClockInput,
  type ExtendLiveEntitlementClockResult,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'

export function createPrismaEntitlementExtensionStore(
  client: PrismaClient = prisma,
): EntitlementExtensionStore {
  return {
    findLiveSubscriptionByUserId: async (userId) => {
      const row = await client.subscription.findFirst({
        where: {
          referenceId: userId,
          status: { in: [...LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES] },
          stripeSubscriptionId: { not: null },
        },
        orderBy: { id: 'desc' },
        select: {
          id: true,
          referenceId: true,
          status: true,
          stripeSubscriptionId: true,
          trialEnd: true,
          periodEnd: true,
        },
      })
      return row
    },
  }
}

export function createStripeEntitlementExtensionGateway(
  stripeClient: Stripe,
): EntitlementExtensionStripeGateway {
  return {
    updateTrialEnd: async ({
      stripeSubscriptionId,
      trialEndUnix,
      metadata,
    }) => {
      const updated = await stripeClient.subscriptions.update(
        stripeSubscriptionId,
        {
          trial_end: trialEndUnix,
          proration_behavior: 'none',
          metadata,
        },
      )
      return {
        trialEndUnix: updated.trial_end ?? trialEndUnix,
      }
    },
  }
}

export async function extendLiveEntitlementClockForAdminboard(
  input: ExtendLiveEntitlementClockInput,
  deps: {
    prisma?: PrismaClient
    stripeClient: Stripe
    now?: () => Date
  },
): Promise<ExtendLiveEntitlementClockResult> {
  return extendLiveEntitlementClock(
    createPrismaEntitlementExtensionStore(deps.prisma),
    createStripeEntitlementExtensionGateway(deps.stripeClient),
    input,
    { now: deps.now },
  )
}
