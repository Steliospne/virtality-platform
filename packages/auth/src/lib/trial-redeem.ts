import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import { APIError } from 'better-auth/api'
import type Stripe from 'stripe'
import {
  evaluateTrialRedeemAtSignUp,
  grantActiveTrialToUser,
  issueFreeGrantToUser,
  redeemTrialCodeAfterSignUp,
  routeSignUpCode,
  TRIAL_REDEEM_SIGNUP_WAITLIST_MESSAGE,
  type TrialRedeemAccessGateIssuer,
  type TrialRedeemConsumeStore,
} from '@virtality/shared/utils'
import { createPrismaTrialGrantStore } from './trial-grant-access.ts'
import { createAccessCodeVariantGateway } from './access-code-variant-adapter.ts'

export function createPrismaTrialRedeemConsumeStore(
  client: PrismaClient = prisma,
  stripeClient: Stripe | null = null,
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

  const variantGateway = createAccessCodeVariantGateway(client, stripeClient)
  const trialGrantStore = createPrismaTrialGrantStore(client)

  return {
    findByCode: (code) =>
      client.trialRedeemCode.findUnique({
        where: { code },
      }),
    consumeAsRedeemed: consumeUnusedAs('redeemed'),
    consumeAsAlreadyEntitled: consumeUnusedAs('already_entitled'),
    applyVariant: variantGateway.applyVariant,
    userHasLiveDefaultSubscription: (userId) =>
      trialGrantStore.userHasLiveDefaultSubscription(userId),
  }
}

export function createTrialRedeemAccessGateIssuer(
  client: PrismaClient = prisma,
): TrialRedeemAccessGateIssuer {
  const store = createPrismaTrialGrantStore(client)
  return {
    issueFreeGrant: (input) => issueFreeGrantToUser(store, input),
    grantActiveTrial: (input) => grantActiveTrialToUser(store, input),
  }
}

/** @deprecated Use `createTrialRedeemAccessGateIssuer`. */
export const createTrialGrantIssuer = createTrialRedeemAccessGateIssuer

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
  stripeClient?: Stripe | null
}): Promise<void> {
  const routed = routeSignUpCode(input.rawCode)
  if (routed.kind !== 'trial_redeem') return

  await redeemTrialCodeAfterSignUp(
    createPrismaTrialRedeemConsumeStore(prisma, input.stripeClient ?? null),
    createTrialRedeemAccessGateIssuer(),
    {
      code: routed.code,
      userId: input.userId,
    },
  )
}
