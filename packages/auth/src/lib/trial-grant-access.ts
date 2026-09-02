import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  billingSnapshotFromSubscription,
  effectiveAssignedProVariant,
  isProSubscriptionPlan,
  adjustTrialGrantForCustomer,
  issueTrialGrantToCustomer,
  LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES,
  pickPrimaryCustomerSubscription,
  revokeTrialGrantForCustomer,
  startTrialGrantForCustomer,
  TRIAL_GRANT_OPEN_STATUSES,
  type AdjustTrialGrantInput,
  type IssueTrialGrantInput,
  type RevokeTrialGrantInput,
  type StartTrialGrantInput,
  type TrialGrantStore,
} from '@virtality/shared/utils'
import { createRenewPromptLifecycle } from './renew-prompt-lifecycle.ts'

const trialGrantRecordSelect = {
  id: true,
  userId: true,
  code: true,
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
          code: input.code,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        },
        select: trialGrantRecordSelect,
      })
    },
    startTrialGrant: async (input) => {
      const pendingId = await findLatestTrialGrantId(client, input.userId, [
        'pending',
      ])
      if (!pendingId) {
        throw new Error(`No pending TrialGrant for user "${input.userId}".`)
      }

      const now = new Date()
      return client.trialGrant.update({
        where: { id: pendingId },
        data: {
          status: 'active',
          trialStart: input.trialStart,
          trialEnd: input.trialEnd,
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
        throw new Error(
          `No pending or active TrialGrant for user "${input.userId}".`,
        )
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
    summarizeBillingState: async (userId) => {
      const user = await client.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
          role: true,
          stripeCustomerId: true,
          assignedProVariant: true,
        },
      })
      if (!user) {
        return {
          role: null,
          stripeCustomerId: null,
          primaryPlan: null,
          primaryStatus: null,
          stripeSubscriptionId: null,
          assignedProVariant: null,
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
        assignedProVariant: effectiveAssignedProVariant(
          user.assignedProVariant,
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
    userHasLiveProSubscription: async (userId) => {
      const live = await client.subscription.findFirst({
        where: {
          referenceId: userId,
          status: { in: [...LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES] },
          stripeSubscriptionId: { not: null },
        },
        select: { plan: true },
      })
      return live != null && isProSubscriptionPlan(live.plan)
    },
  }
}

export type TrialGrantRuntime = {
  issueGrant: (
    input: IssueTrialGrantInput,
  ) => ReturnType<typeof issueTrialGrantToCustomer>
  startTrial: (
    input: StartTrialGrantInput,
  ) => ReturnType<typeof startTrialGrantForCustomer>
  adjustTrial: (
    input: AdjustTrialGrantInput,
  ) => ReturnType<typeof adjustTrialGrantForCustomer>
  revokeTrial: (
    input: RevokeTrialGrantInput,
  ) => ReturnType<typeof revokeTrialGrantForCustomer>
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
    issueGrant(input) {
      return issueTrialGrantToCustomer(store, input)
    },
    async startTrial(input) {
      const result = await startTrialGrantForCustomer(store, input, {
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
  }
}
