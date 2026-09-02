import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  billingSnapshotFromSubscription,
  effectiveAssignedProVariant,
  isProSubscriptionPlan,
  issueTrialGrantToCustomer,
  LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES,
  pickPrimaryCustomerSubscription,
  startTrialGrantForCustomer,
  TRIAL_GRANT_OPEN_STATUSES,
  type IssueTrialGrantInput,
  type StartTrialGrantInput,
  type TrialGrantStore,
} from '@virtality/shared/utils'
import { createRenewPromptLifecycle } from './renew-prompt-lifecycle.ts'

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
        select: {
          id: true,
          userId: true,
          code: true,
          status: true,
          trialStart: true,
          trialEnd: true,
        },
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
        select: {
          id: true,
          userId: true,
          code: true,
          status: true,
          trialStart: true,
          trialEnd: true,
        },
      })
    },
    startTrialGrant: async (input) => {
      const pending = await client.trialGrant.findFirst({
        where: {
          userId: input.userId,
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })
      if (!pending) {
        throw new Error(`No pending TrialGrant for user "${input.userId}".`)
      }

      const now = new Date()
      return client.trialGrant.update({
        where: { id: pending.id },
        data: {
          status: 'active',
          trialStart: input.trialStart,
          trialEnd: input.trialEnd,
          updatedAt: now,
        },
        select: {
          id: true,
          userId: true,
          code: true,
          status: true,
          trialStart: true,
          trialEnd: true,
        },
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
  }
}
