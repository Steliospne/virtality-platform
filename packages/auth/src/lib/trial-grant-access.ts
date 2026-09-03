import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  billingSnapshotFromSubscription,
  convertActiveTrialGrantOnPaidSubscription,
  effectiveAssignedPlanVariant,
  isDefaultSubscriptionPlan,
  adjustTrialGrantForCustomer,
  issueTrialGrantToCustomer,
  LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES,
  pickPrimaryCustomerSubscription,
  revokeTrialGrantForCustomer,
  TRIAL_GRANT_OPEN_STATUSES,
  type AdjustTrialGrantInput,
  type ConvertActiveTrialGrantInput,
  type ConvertActiveTrialGrantResult,
  type IssueTrialGrantInput,
  type RevokeTrialGrantInput,
  type TrialGrantStore,
} from '@virtality/shared/utils'
import { createRenewPromptLifecycle } from './renew-prompt-lifecycle.ts'

const trialGrantRecordSelect = {
  id: true,
  userId: true,
  status: true,
  trialStart: true,
  trialEnd: true,
} as const

async function findLatestTrialGrantId(
  client: PrismaClient,
  userId: string,
  statuses: readonly (typeof TRIAL_GRANT_OPEN_STATUSES)[number][],
): Promise<string | null> {
  const row = await client.trialGrant.findFirst({
    where: {
      userId,
      status: { in: [...statuses] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
  return row?.id ?? null
}

export function createPrismaTrialGrantStore(
  client: PrismaClient = prisma,
): TrialGrantStore {
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
    findOpenTrialGrantByUserId: async (userId) => {
      const row = await client.trialGrant.findFirst({
        where: {
          userId,
          status: { in: [...TRIAL_GRANT_OPEN_STATUSES] },
        },
        orderBy: { createdAt: 'desc' },
        select: trialGrantRecordSelect,
      })
      return row
    },
    createTrialGrant: async (input) => {
      const now = new Date()
      return client.trialGrant.create({
        data: {
          userId: input.userId,
          status: 'active',
          trialStart: input.trialStart,
          trialEnd: input.trialEnd,
          createdAt: now,
          updatedAt: now,
        },
        select: trialGrantRecordSelect,
      })
    },
    adjustTrialGrant: async (input) => {
      const activeId = await findLatestTrialGrantId(client, input.userId, [
        'active',
      ])
      if (!activeId) {
        throw new Error(`No active TrialGrant for user "${input.userId}".`)
      }

      const now = new Date()
      return client.trialGrant.update({
        where: { id: activeId },
        data: {
          trialEnd: input.trialEnd,
          updatedAt: now,
        },
        select: trialGrantRecordSelect,
      })
    },
    revokeTrialGrant: async (input) => {
      const openId = await findLatestTrialGrantId(
        client,
        input.userId,
        TRIAL_GRANT_OPEN_STATUSES,
      )
      if (!openId) {
        throw new Error(`No open TrialGrant for user "${input.userId}".`)
      }

      const now = new Date()
      return client.trialGrant.update({
        where: { id: openId },
        data: {
          status: 'revoked',
          updatedAt: now,
        },
        select: trialGrantRecordSelect,
      })
    },
    convertActiveTrialGrantByUserId: async (userId) => {
      const active = await client.trialGrant.findFirst({
        where: {
          userId,
          status: 'active',
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })
      if (!active) {
        return null
      }

      const now = new Date()
      return client.trialGrant.update({
        where: { id: active.id },
        data: {
          status: 'converted',
          updatedAt: now,
        },
        select: trialGrantRecordSelect,
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

export type TrialGrantRuntime = {
  issueGrant: (
    input: IssueTrialGrantInput,
  ) => ReturnType<typeof issueTrialGrantToCustomer>
  adjustTrial: (
    input: AdjustTrialGrantInput,
  ) => ReturnType<typeof adjustTrialGrantForCustomer>
  revokeTrial: (
    input: RevokeTrialGrantInput,
  ) => ReturnType<typeof revokeTrialGrantForCustomer>
  convertAfterPaidCheckout: (
    input: ConvertActiveTrialGrantInput,
  ) => Promise<ConvertActiveTrialGrantResult>
}

export function createTrialGrantRuntime(deps: {
  prisma?: PrismaClient
  now?: () => Date
}): TrialGrantRuntime {
  const client = deps.prisma ?? prisma
  const store = createPrismaTrialGrantStore(client)
  const lifecycle = createRenewPromptLifecycle({
    prisma: client,
    now: deps.now,
  })

  return {
    async issueGrant(input) {
      const result = await issueTrialGrantToCustomer(store, input, {
        now: deps.now,
      })
      await lifecycle.rearmForNewClock({
        userId: input.userId,
        clockEnd: result.trialEnd,
      })
      return result
    },
    async adjustTrial(input) {
      const result = await adjustTrialGrantForCustomer(store, input, {
        now: deps.now,
      })

      await lifecycle.rearmAfterExtension({
        userId: input.userId,
        previousClockEnd: result.previousTrialEnd,
        nextClockEnd: result.trialEnd,
      })

      return result
    },
    revokeTrial(input) {
      return revokeTrialGrantForCustomer(store, input)
    },
    convertAfterPaidCheckout(input) {
      return convertActiveTrialGrantOnPaidSubscription(store, input)
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
