import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import { redeemAccessCodeOnProfile } from '@virtality/shared/utils'
import type Stripe from 'stripe'
import {
  createPrismaTrialRedeemConsumeStore,
  createProfileAccessGateIssuerFromTrialGrantStore,
} from './trial-redeem.ts'
import { createPrismaTrialGrantStore } from './trial-grant-access.ts'

type ConsoleAccessCodeDeps = {
  prisma?: PrismaClient
  stripeClient: Stripe | null
}

export async function redeemAccessCodeForUser(
  input: { userId: string; code: string },
  deps: ConsoleAccessCodeDeps,
) {
  const client = deps.prisma ?? prisma
  const trialGrantStore = createPrismaTrialGrantStore(client)
  const store = createPrismaTrialRedeemConsumeStore(client, deps.stripeClient)
  const accessGate =
    createProfileAccessGateIssuerFromTrialGrantStore(trialGrantStore)

  return redeemAccessCodeOnProfile(store, accessGate, {
    userId: input.userId,
    code: input.code,
  })
}
