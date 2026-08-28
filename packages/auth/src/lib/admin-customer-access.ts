import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  billingSnapshotFromSubscription,
  buildPermanentFreeSubscriptionStripeParams,
  buildTimedTrialSubscriptionStripeParams,
  LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES,
  pickPrimaryCustomerSubscription,
  TRIAL_REDEEM_ENTITLED_SUBSCRIPTION_STATUSES,
  type AdminCustomerAccessStore,
  type AdminCustomerAccessStripeGateway,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'

export function createPrismaAdminCustomerAccessStore(
  client: PrismaClient = prisma,
): AdminCustomerAccessStore {
  return {
    findTargetUser: async (userId) => {
      const user = await client.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          stripeCustomerId: true,
        },
      })
      return user ?? null
    },
    updateStripeCustomerId: async (userId, stripeCustomerId) => {
      await client.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      })
    },
    updateRoleToUser: async (userId) => {
      await client.user.update({
        where: { id: userId },
        data: { role: 'user' },
      })
    },
    findLiveSubscriptionByUserId: async (userId) => {
      const row = await client.subscription.findFirst({
        where: {
          referenceId: userId,
          status: { in: [...LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES] },
          stripeSubscriptionId: { not: null },
        },
        orderBy: { id: 'desc' },
        select: {
          id: true,
          referenceId: true,
          status: true,
          stripeSubscriptionId: true,
          trialEnd: true,
          periodEnd: true,
        },
      })
      return row
    },
    summarizeBillingState: async (userId) => {
      const user = await client.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
          role: true,
          stripeCustomerId: true,
        },
      })
      if (!user) {
        return {
          role: null,
          stripeCustomerId: null,
          primaryPlan: null,
          primaryStatus: null,
          stripeSubscriptionId: null,
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
      return { id: row.id, record }
    },
  }
}

export function createStripeAdminCustomerAccessGateway(
  stripeClient: Stripe,
): AdminCustomerAccessStripeGateway {
  return {
    createCustomer: async ({ email, name, metadata }) => {
      const customer = await stripeClient.customers.create({
        email,
        name,
        metadata,
      })
      return { customerId: customer.id }
    },
    customerHasEntitledSubscription: async (customerId) => {
      const results = await Promise.all(
        TRIAL_REDEEM_ENTITLED_SUBSCRIPTION_STATUSES.map((status) =>
          stripeClient.subscriptions.list({
            customer: customerId,
            status,
            limit: 1,
          }),
        ),
      )
      return results.some((page) => page.data.length > 0)
    },
    createPermanentFreeSubscription: async (input) => {
      const actorUserId = input.metadata.adminCustomerActorUserId ?? ''
      const subscription = await stripeClient.subscriptions.create(
        buildPermanentFreeSubscriptionStripeParams({
          customerId: input.customerId,
          priceId: input.priceId,
          actorUserId,
        }),
      )
      return { stripeSubscriptionId: subscription.id }
    },
    createTimedTrialSubscription: async (input) => {
      const actorUserId = input.metadata.adminCustomerActorUserId ?? ''
      const subscription = await stripeClient.subscriptions.create(
        buildTimedTrialSubscriptionStripeParams({
          customerId: input.customerId,
          priceId: input.priceId,
          trialEndUnix: input.trialEndUnix,
          actorUserId,
        }),
      )
      const trialEndUnix = subscription.trial_end ?? input.trialEndUnix
      return {
        stripeSubscriptionId: subscription.id,
        trialEndUnix,
      }
    },
  }
}
