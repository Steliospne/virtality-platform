import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  grantActiveTrialToUser,
  issueFreeGrantToUser,
  redeemAccessCodeOnProfile,
  type ConsoleAccessCodeAccessGateIssuer,
  type ConsoleAccessCodeStore,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import { createPrismaTrialRedeemConsumeStore } from './trial-redeem.ts'
import { createPrismaTrialGrantStore } from './trial-grant-access.ts'

type ConsoleAccessCodeDeps = {
  prisma?: PrismaClient
  stripeClient: Stripe | null
}

function createPrismaConsoleAccessCodeStore(
  client: PrismaClient = prisma,
  stripeClient: Stripe | null = null,
): ConsoleAccessCodeStore {
  const consumeStore = createPrismaTrialRedeemConsumeStore(client, stripeClient)
  const trialGrantStore = createPrismaTrialGrantStore(client)
  return {
    ...consumeStore,
    userHasLiveDefaultSubscription: (userId) =>
      trialGrantStore.userHasLiveDefaultSubscription(userId),
  }
}

function createConsoleAccessCodeAccessGateIssuer(
  client: PrismaClient = prisma,
): ConsoleAccessCodeAccessGateIssuer {
  const store = createPrismaTrialGrantStore(client)
  return {
    hasOpenGrantedAccessGate: async (userId) =>
      (await store.findOpenGrantedAccessGateByUserId(userId)) != null,
    hasOpenTimedAccessGate: async (userId) =>
      (await store.findOpenTimedAccessGateByUserId(userId)) != null,
    issueFreeGrant: (input) => issueFreeGrantToUser(store, input),
    grantActiveTrial: (input) => grantActiveTrialToUser(store, input),
  }
}

export async function redeemAccessCodeForUser(
  input: { userId: string; code: string },
  deps: ConsoleAccessCodeDeps,
) {
  const client = deps.prisma ?? prisma
  const store = createPrismaConsoleAccessCodeStore(client, deps.stripeClient)
  const accessGate = createConsoleAccessCodeAccessGateIssuer(client)

  return redeemAccessCodeOnProfile(store, accessGate, {
    userId: input.userId,
    code: input.code,
  })
}
