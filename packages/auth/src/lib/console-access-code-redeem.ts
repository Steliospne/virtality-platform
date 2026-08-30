import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  CONSOLE_PROMO_ELIGIBLE_STATUSES,
  FREE_SUBSCRIPTION_PLAN,
  redeemAccessCodeOnProfile,
  type ConsoleAccessCodeStore,
  type ConsoleAccessCodeStripeGateway,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import {
  createPrismaTrialRedeemConsumeStore,
  createStripeTrialRedeemGateway,
} from './trial-redeem.ts'

type ConsoleAccessCodeDeps = {
  prisma?: PrismaClient
  stripeClient: Stripe
  priceId: string
}

function createPrismaConsoleAccessCodeStore(
  client: PrismaClient = prisma,
): ConsoleAccessCodeStore {
  const consumeStore = createPrismaTrialRedeemConsumeStore(client)
  return {
    ...consumeStore,
    findBillingSeatByUserId: async (userId) => {
      const row = await client.subscription.findFirst({
        where: {
          referenceId: userId,
          status: { in: [...CONSOLE_PROMO_ELIGIBLE_STATUSES] },
          stripeSubscriptionId: { not: null },
        },
        orderBy: { id: 'desc' },
        select: {
          status: true,
          plan: true,
          stripeSubscriptionId: true,
        },
      })
      if (!row?.stripeSubscriptionId) return null
      return {
        status: row.status,
        plan: row.plan,
        stripeSubscriptionId: row.stripeSubscriptionId,
      }
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

function createStripeConsoleAccessCodeGateway(
  stripeClient: Stripe,
): ConsoleAccessCodeStripeGateway {
  return {
    ...createStripeTrialRedeemGateway(stripeClient),
    attachTrialOnSubscription: async ({
      stripeSubscriptionId,
      trialEndUnix,
      metadata,
    }) => {
      await stripeClient.subscriptions.update(stripeSubscriptionId, {
        trial_end: trialEndUnix,
        proration_behavior: 'none',
        metadata: {
          plan: FREE_SUBSCRIPTION_PLAN,
          trialRedeemCodeId: metadata.trialRedeemCodeId,
        },
      })
    },
  }
}

export async function redeemAccessCodeForUser(
  input: { userId: string; code: string },
  deps: ConsoleAccessCodeDeps,
) {
  const client = deps.prisma ?? prisma
  const store = createPrismaConsoleAccessCodeStore(client)
  const stripe = createStripeConsoleAccessCodeGateway(deps.stripeClient)
  const stripeCustomerId =
    (await store.findStripeCustomerIdByUserId(input.userId)) ?? ''

  return redeemAccessCodeOnProfile(store, stripe, {
    userId: input.userId,
    code: input.code,
    stripeCustomerId,
    priceId: deps.priceId,
  })
}
