import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import { APIError } from 'better-auth/api'
import type Stripe from 'stripe'
import {
  buildFreeTrialSubscriptionCreateParams,
  buildPermanentFreeSubscriptionCreateParams,
  evaluateTrialRedeemAtSignUp,
  redeemTrialCodeAfterSignUp,
  routeSignUpCode,
  TRIAL_REDEEM_ENTITLED_SUBSCRIPTION_STATUSES,
  TRIAL_REDEEM_SIGNUP_WAITLIST_MESSAGE,
  type TrialRedeemConsumeStore,
  type TrialRedeemStripeGateway,
} from '@virtality/shared/utils'

export function createPrismaTrialRedeemConsumeStore(
  client: PrismaClient = prisma,
): TrialRedeemConsumeStore {
  const consumeUnusedAs =
    (status: 'redeemed' | 'already_entitled') =>
    async (id: number, usedBy: string, usedAt: Date) => {
      const { count } = await client.trialRedeemCode.updateMany({
        where: { id, status: 'unused' },
        data: {
          status,
          usedAt,
          usedBy,
        },
      })
      return count > 0
    }

  return {
    findByCode: (code) =>
      client.trialRedeemCode.findUnique({
        where: { code },
      }),
    consumeAsRedeemed: consumeUnusedAs('redeemed'),
    consumeAsAlreadyEntitled: consumeUnusedAs('already_entitled'),
  }
}

export function createStripeTrialRedeemGateway(
  stripeClient: Stripe,
): TrialRedeemStripeGateway {
  return {
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
      trialPeriodDays,
      metadata,
    }) => {
      const subscription = await stripeClient.subscriptions.create(
        buildFreeTrialSubscriptionCreateParams({
          customerId,
          priceId,
          trialPeriodDays,
          metadata,
        }),
      )
      return { stripeSubscriptionId: subscription.id }
    },
    createPermanentFreeSubscription: async ({
      customerId,
      priceId,
      metadata,
    }) => {
      const subscription = await stripeClient.subscriptions.create(
        buildPermanentFreeSubscriptionCreateParams({
          customerId,
          priceId,
          metadata,
        }),
      )
      return { stripeSubscriptionId: subscription.id }
    },
  }
}

/** Reads the shared sign-up code field from email body or OAuth additionalData. */
export function readSignUpCodeFromUnknown(source: unknown): string | undefined {
  if (!source || typeof source !== 'object') return undefined
  const record = source as Record<string, unknown>
  const code = record.testerCode ?? record.re
  return typeof code === 'string' ? code : undefined
}

const trialRedeemStore = createPrismaTrialRedeemConsumeStore()

export async function assertTrialRedeemAllowedAtSignUp(
  rawCode: string | null | undefined,
): Promise<void> {
  const gate = await evaluateTrialRedeemAtSignUp(trialRedeemStore, rawCode)
  if (gate.action === 'block') {
    throw new APIError('BAD_REQUEST', { message: gate.message })
  }
  if (gate.action === 'waitlist') {
    throw new APIError('BAD_REQUEST', {
      message: TRIAL_REDEEM_SIGNUP_WAITLIST_MESSAGE,
    })
  }
}

export async function redeemTrialCodeForCustomer(input: {
  rawCode: string | null | undefined
  userId: string
  stripeCustomerId: string
  priceId: string
  stripeClient: Stripe
}): Promise<void> {
  const routed = routeSignUpCode(input.rawCode)
  if (routed.kind !== 'trial_redeem') return

  await redeemTrialCodeAfterSignUp(
    trialRedeemStore,
    createStripeTrialRedeemGateway(input.stripeClient),
    {
      code: routed.code,
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
      priceId: input.priceId,
    },
  )
}
