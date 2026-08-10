import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  extendEntitlementClock,
  LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES,
  TRIAL_REDEEM_ENTITLED_SUBSCRIPTION_STATUSES,
  type EntitlementExtensionStore,
  type EntitlementExtensionStripeGateway,
  type ExtendEntitlementClockInput,
  type ExtendEntitlementClockResult,
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
    findStripeCustomerIdByUserId: async (userId) => {
      const user = await client.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { stripeCustomerId: true },
      })
      return user?.stripeCustomerId ?? null
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
    customerHasEntitledSubscription: async (customerId) => {
      const results = await Promise.all(
        TRIAL_REDEEM_ENTITLED_SUBSCRIPTION_STATUSES.map((status) =>
          stripeClient.subscriptions.list({
            customer: customerId,
            status,
            limit: 1,
          }),
        ),
      )
      return results.some((page) => page.data.length > 0)
    },
    createNoCardTrialSubscription: async ({
      customerId,
      priceId,
      trialEndUnix,
      metadata,
    }) => {
      const subscription = await stripeClient.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_end: trialEndUnix,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
        metadata,
      })
      return { stripeSubscriptionId: subscription.id }
    },
  }
}

export async function extendEntitlementClockForAdminboard(
  input: ExtendEntitlementClockInput,
  deps: {
    prisma?: PrismaClient
    stripeClient: Stripe
    now?: () => Date
  },
): Promise<ExtendEntitlementClockResult> {
  return extendEntitlementClock(
    createPrismaEntitlementExtensionStore(deps.prisma),
    createStripeEntitlementExtensionGateway(deps.stripeClient),
    input,
    { now: deps.now },
  )
}
