import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  CONSOLE_PROMO_ELIGIBLE_STATUSES,
  grantActiveTrialToUser,
  redeemAccessCodeOnProfile,
  type ConsoleAccessCodeStore,
  type ConsoleAccessCodeStripeGateway,
  type ConsoleAccessCodeTrialGrantIssuer,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import {
  createPrismaTrialRedeemConsumeStore,
  createStripeTrialRedeemGateway,
} from './trial-redeem.ts'
import { createPrismaTrialGrantStore } from './trial-grant-access.ts'

type ConsoleAccessCodeDeps = {
  prisma?: PrismaClient
  stripeClient: Stripe
  priceId: string
}

function createPrismaConsoleAccessCodeStore(
  client: PrismaClient = prisma,
  stripeClient: Stripe | null = null,
): ConsoleAccessCodeStore {
  const consumeStore = createPrismaTrialRedeemConsumeStore(client, stripeClient)
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

function createConsoleAccessCodeTrialGrantIssuer(
  client: PrismaClient = prisma,
): ConsoleAccessCodeTrialGrantIssuer {
  const store = createPrismaTrialGrantStore(client)
  return {
    hasOpenTrialGrant: async (userId) =>
      (await store.findOpenTrialGrantByUserId(userId)) != null,
    grantActiveTrial: (input) => grantActiveTrialToUser(store, input),
  }
}

export async function redeemAccessCodeForUser(
  input: { userId: string; code: string },
  deps: ConsoleAccessCodeDeps,
) {
  const client = deps.prisma ?? prisma
  const store = createPrismaConsoleAccessCodeStore(client, deps.stripeClient)
  const stripe = createStripeTrialRedeemGateway(deps.stripeClient)
  const trialGrant = createConsoleAccessCodeTrialGrantIssuer(client)
  const stripeCustomerId =
    (await store.findStripeCustomerIdByUserId(input.userId)) ?? ''

  return redeemAccessCodeOnProfile(store, stripe, trialGrant, {
    userId: input.userId,
    code: input.code,
    stripeCustomerId,
    priceId: deps.priceId,
  })
}
