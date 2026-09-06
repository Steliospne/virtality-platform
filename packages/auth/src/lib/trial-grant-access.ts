import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  ACCESS_GATE_OPEN_STATUSES,
  convertActiveTrialGrantOnPaidSubscription,
  isDefaultSubscriptionPlan,
  LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES,
  type ConvertActiveTrialGrantInput,
  type ConvertActiveTrialGrantResult,
  type TrialGrantStore,
} from '@virtality/shared/utils'

const trialGrantRecordSelect = {
  id: true,
  userId: true,
  status: true,
  trialStart: true,
  trialEnd: true,
} as const

async function findLatestAccessGateByUserId(
  client: PrismaClient,
  userId: string,
  status: 'trialing' | 'granted',
) {
  return client.trialGrant.findFirst({
    where: { userId, status },
    orderBy: { createdAt: 'desc' },
    select: trialGrantRecordSelect,
  })
}

export function createPrismaTrialGrantStore(
  client: PrismaClient = prisma,
): TrialGrantStore {
  return {
    findOpenTrialGrantByUserId: async (userId) => {
      const row = await client.trialGrant.findFirst({
        where: {
          userId,
          status: { in: [...ACCESS_GATE_OPEN_STATUSES] },
        },
        orderBy: { createdAt: 'desc' },
        select: trialGrantRecordSelect,
      })
      return row
    },
    findOpenTimedAccessGateByUserId: async (userId) =>
      findLatestAccessGateByUserId(client, userId, 'trialing'),
    findOpenGrantedAccessGateByUserId: async (userId) =>
      findLatestAccessGateByUserId(client, userId, 'granted'),
    createTrialGrant: async (input) => {
      const now = new Date()
      return client.trialGrant.create({
        data: {
          userId: input.userId,
          status: input.status,
          trialStart: input.trialStart,
          trialEnd: input.trialEnd,
          createdAt: now,
          updatedAt: now,
        },
        select: trialGrantRecordSelect,
      })
    },
    convertActiveTrialGrantByUserId: async (userId) => {
      const openGrant = await client.trialGrant.findFirst({
        where: {
          userId,
          status: { in: [...ACCESS_GATE_OPEN_STATUSES] },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })
      if (!openGrant) {
        return null
      }

      const now = new Date()
      return client.trialGrant.update({
        where: { id: openGrant.id },
        data: {
          status: 'converted',
          updatedAt: now,
        },
        select: trialGrantRecordSelect,
      })
    },
    userHasLiveDefaultSubscription: async (userId) => {
      const live = await client.subscription.findFirst({
        where: {
          referenceId: userId,
          status: { in: [...LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES] },
          stripeSubscriptionId: { not: null },
        },
        select: { plan: true },
      })
      return live != null && isDefaultSubscriptionPlan(live.plan)
    },
  }
}

export async function convertTrialGrantAfterPaidCheckout(
  input: ConvertActiveTrialGrantInput,
  deps: { prisma?: PrismaClient } = {},
): Promise<ConvertActiveTrialGrantResult> {
  const store = createPrismaTrialGrantStore(deps.prisma ?? prisma)
  return convertActiveTrialGrantOnPaidSubscription(store, input)
}
