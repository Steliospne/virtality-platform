import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import { APIError } from 'better-auth/api'
import type Stripe from 'stripe'
import {
  evaluateTrialRedeemAtSignUp,
  redeemTrialCodeAfterSignUp,
  routeSignUpCode,
  type TrialRedeemConsumeStore,
  type TrialRedeemStripeGateway,
} from '@virtality/shared/utils'

export function createPrismaTrialRedeemConsumeStore(
  client: PrismaClient = prisma,
): TrialRedeemConsumeStore {
  return {
    findByCode: (code) =>
      client.trialRedeemCode.findUnique({
        where: { code },
      }),
    findById: (id) =>
      client.trialRedeemCode.findUnique({
        where: { id },
      }),
    create: (data) => client.trialRedeemCode.create({ data }),
    listAll: () =>
      client.trialRedeemCode.findMany({
        orderBy: { id: 'desc' },
      }),
    deleteById: async (id) => {
      await client.trialRedeemCode.delete({
        where: { id },
      })
    },
    consumeAsRedeemed: async (id, usedBy, usedAt) => {
      const { count } = await client.trialRedeemCode.updateMany({
        where: { id, status: 'unused' },
        data: {
          status: 'redeemed',
          usedAt,
          usedBy,
        },
      })
      return count > 0
    },
  }
}

export function createStripeTrialRedeemGateway(
  stripeClient: Stripe,
): TrialRedeemStripeGateway {
  return {
    createNoCardTrialSubscription: async ({
      customerId,
      priceId,
      trialPeriodDays,
      metadata,
    }) => {
      const subscription = await stripeClient.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialPeriodDays,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
        metadata: {
          trialRedeemCodeId: metadata.trialRedeemCodeId,
        },
      })
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

export async function assertTrialRedeemAllowedAtSignUp(
  rawCode: string | null | undefined,
): Promise<void> {
  const gate = await evaluateTrialRedeemAtSignUp(
    createPrismaTrialRedeemConsumeStore(),
    rawCode,
  )
  if (gate.action === 'block') {
    throw new APIError('BAD_REQUEST', { message: gate.message })
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
    createPrismaTrialRedeemConsumeStore(),
    createStripeTrialRedeemGateway(input.stripeClient),
    {
      code: routed.code,
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
      priceId: input.priceId,
    },
  )
}
