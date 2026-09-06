import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  ACCESS_GATE_OPEN_STATUSES,
  assignPermanentAccessGateToCustomer,
  billingSnapshotFromSubscription,
  effectiveAssignedPlanVariant,
  pickPrimaryCustomerSubscription,
  revokeAccessGateForCustomer,
  setAccessGateTrialForCustomer,
  type AssignPermanentAccessGateInput,
  type RevokeAccessGateInput,
  type SetAccessGateTrialInput,
  type StaffAccessGateStore,
} from '@virtality/shared/utils'
import { createRenewPromptLifecycle } from './renew-prompt-lifecycle.ts'

const accessGateRecordSelect = {
  id: true,
  userId: true,
  status: true,
  trialStart: true,
  trialEnd: true,
} as const

async function findLatestOpenAccessGateId(
  client: PrismaClient,
  userId: string,
): Promise<string | null> {
  const row = await client.trialGrant.findFirst({
    where: {
      userId,
      status: { in: [...ACCESS_GATE_OPEN_STATUSES] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
  return row?.id ?? null
}

export function createPrismaStaffAccessGateStore(
  client: PrismaClient = prisma,
): StaffAccessGateStore {
  return {
    findTargetUser: async (userId) => {
      const user = await client.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })
      return user ?? null
    },
    findOpenAccessGateByUserId: async (userId) => {
      const row = await client.trialGrant.findFirst({
        where: {
          userId,
          status: { in: [...ACCESS_GATE_OPEN_STATUSES] },
        },
        orderBy: { createdAt: 'desc' },
        select: accessGateRecordSelect,
      })
      return row
    },
    userHasConvertedAccessGate: async (userId) => {
      const row = await client.trialGrant.findFirst({
        where: { userId, status: 'converted' },
        select: { id: true },
      })
      return row != null
    },
    createAccessGate: async (input) => {
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
        select: accessGateRecordSelect,
      })
    },
    updateAccessGate: async (input) => {
      const now = new Date()
      return client.trialGrant.update({
        where: { id: input.accessGateId },
        data: {
          status: input.status,
          trialStart: input.trialStart,
          trialEnd: input.trialEnd,
          updatedAt: now,
        },
        select: accessGateRecordSelect,
      })
    },
    revokeAccessGate: async (input) => {
      const openId = await findLatestOpenAccessGateId(client, input.userId)
      if (!openId) {
        throw new Error(`No open Access Gate for user "${input.userId}".`)
      }

      const now = new Date()
      return client.trialGrant.update({
        where: { id: openId },
        data: {
          status: 'revoked',
          updatedAt: now,
        },
        select: accessGateRecordSelect,
      })
    },
    updateRoleToUser: async (userId) => {
      await client.user.update({
        where: { id: userId },
        data: { role: 'user' },
      })
    },
    summarizeBillingState: async (userId) => {
      const user = await client.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
          role: true,
          stripeCustomerId: true,
          assignedDefaultVariant: true,
        },
      })
      if (!user) {
        return {
          role: null,
          stripeCustomerId: null,
          primaryPlan: null,
          primaryStatus: null,
          stripeSubscriptionId: null,
          assignedDefaultVariant: null,
        }
      }

      const subscriptions = await client.subscription.findMany({
        where: { referenceId: userId },
        select: {
          id: true,
          plan: true,
          status: true,
          stripeSubscriptionId: true,
          trialEnd: true,
          periodEnd: true,
          endedAt: true,
          canceledAt: true,
        },
      })
      const primary = pickPrimaryCustomerSubscription(subscriptions)

      return billingSnapshotFromSubscription({
        role: user.role,
        stripeCustomerId: user.stripeCustomerId,
        assignedDefaultVariant: effectiveAssignedPlanVariant(
          user.assignedDefaultVariant,
        ),
        subscription: primary,
      })
    },
    recordAudit: async (record) => {
      const row = await client.adminCustomerAudit.create({
        data: {
          targetUserId: record.targetUserId,
          actorUserId: record.actorUserId,
          action: record.action,
          reason: record.reason,
          outcome: record.outcome,
          stripeOperationId: record.stripeOperationId,
          beforeBillingState: record.beforeBillingState,
          afterBillingState: record.afterBillingState ?? undefined,
          createdAt: new Date(),
        },
      })
      return { id: row.id }
    },
  }
}

export type StaffAccessGateRuntime = {
  assignPermanentAccessGate: (
    input: AssignPermanentAccessGateInput,
  ) => ReturnType<typeof assignPermanentAccessGateToCustomer>
  setAccessGateTrial: (
    input: SetAccessGateTrialInput,
  ) => ReturnType<typeof setAccessGateTrialForCustomer>
  revokeAccessGate: (
    input: RevokeAccessGateInput,
  ) => ReturnType<typeof revokeAccessGateForCustomer>
}

export function createStaffAccessGateRuntime(deps: {
  prisma?: PrismaClient
  now?: () => Date
}): StaffAccessGateRuntime {
  const client = deps.prisma ?? prisma
  const store = createPrismaStaffAccessGateStore(client)
  const lifecycle = createRenewPromptLifecycle({
    prisma: client,
    now: deps.now,
  })

  return {
    assignPermanentAccessGate(input) {
      return assignPermanentAccessGateToCustomer(store, input, {
        now: deps.now,
      })
    },
    async setAccessGateTrial(input) {
      const result = await setAccessGateTrialForCustomer(store, input, {
        now: deps.now,
      })

      if (result.mode === 'issued') {
        await lifecycle.rearmForNewClock({
          userId: input.userId,
          clockEnd: result.trialEnd,
        })
      } else {
        await lifecycle.rearmAfterExtension({
          userId: input.userId,
          previousClockEnd: result.previousTrialEnd,
          nextClockEnd: result.trialEnd,
        })
      }

      return result
    },
    revokeAccessGate(input) {
      return revokeAccessGateForCustomer(store, input)
    },
  }
}
