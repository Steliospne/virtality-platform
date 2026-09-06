import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  ACCESS_GATE_OPEN_STATUSES,
  convertActiveAccessGrantOnPaidSubscription,
  isDefaultSubscriptionPlan,
  LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES,
  type ConvertActiveAccessGrantInput,
  type ConvertActiveAccessGrantResult,
  type AccessGrantStore,
} from '@virtality/shared/utils'

const accessGrantRecordSelect = {
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
  return client.accessGrant.findFirst({
    where: { userId, status },
    orderBy: { createdAt: 'desc' },
    select: accessGrantRecordSelect,
  })
}

export function createPrismaAccessGrantStore(
  client: PrismaClient = prisma,
): AccessGrantStore {
  return {
    findOpenAccessGrantByUserId: async (userId) => {
      const row = await client.accessGrant.findFirst({
        where: {
          userId,
          status: { in: [...ACCESS_GATE_OPEN_STATUSES] },
        },
        orderBy: { createdAt: 'desc' },
        select: accessGrantRecordSelect,
      })
      return row
    },
    findOpenTimedAccessGateByUserId: async (userId) =>
      findLatestAccessGateByUserId(client, userId, 'trialing'),
    findOpenGrantedAccessGateByUserId: async (userId) =>
      findLatestAccessGateByUserId(client, userId, 'granted'),
    createAccessGrant: async (input) => {
      const now = new Date()
      return client.accessGrant.create({
        data: {
          userId: input.userId,
          status: input.status,
          trialStart: input.trialStart,
          trialEnd: input.trialEnd,
          createdAt: now,
          updatedAt: now,
        },
        select: accessGrantRecordSelect,
      })
    },
    convertActiveAccessGrantByUserId: async (userId) => {
      const openGrant = await client.accessGrant.findFirst({
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
      return client.accessGrant.update({
        where: { id: openGrant.id },
        data: {
          status: 'converted',
          updatedAt: now,
        },
        select: accessGrantRecordSelect,
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

export async function convertAccessGrantAfterPaidCheckout(
  input: ConvertActiveAccessGrantInput,
  deps: { prisma?: PrismaClient } = {},
): Promise<ConvertActiveAccessGrantResult> {
  const store = createPrismaAccessGrantStore(deps.prisma ?? prisma)
  return convertActiveAccessGrantOnPaidSubscription(store, input)
}
