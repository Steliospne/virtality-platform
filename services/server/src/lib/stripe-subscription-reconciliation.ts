import { prisma } from '@virtality/db'
import { readPlanVariantCatalogOrSandbox, stripeClient } from '@virtality/auth'
import {
  buildBetterAuthStripePlansFromPlanVariantCatalog,
  reconcileStripeSubscriptions,
  type ReconciliationStore,
  type ReconciliationStripeGateway,
  type ReconciliationStripeSubscription,
  type ReconciliationLogger,
} from '@virtality/shared/utils'
import type { AppLogger } from '@virtality/shared/observability'
import type Stripe from 'stripe'
import { randomUUID } from 'node:crypto'
import {
  alertStripeSubscriptionReconciliationDrift,
  alertStripeSubscriptionReconciliationFailure,
  createStripeSubscriptionReconciliationAlertDeps,
} from './stripe-subscription-reconciliation-alerts.ts'

function mapStripeSubscription(
  subscription: Stripe.Subscription,
): ReconciliationStripeSubscription {
  return {
    id: subscription.id,
    customer:
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id,
    status: subscription.status,
    metadata: subscription.metadata ?? undefined,
    items: {
      data: subscription.items.data.map((item) => ({
        price: {
          id: item.price.id,
          lookup_key: item.price.lookup_key,
          recurring: item.price.recurring
            ? { interval: item.price.recurring.interval }
            : null,
        },
        quantity: item.quantity,
        current_period_start: item.current_period_start,
        current_period_end: item.current_period_end,
      })),
    },
    trial_start: subscription.trial_start,
    trial_end: subscription.trial_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at,
    canceled_at: subscription.canceled_at,
    ended_at: subscription.ended_at,
    schedule: subscription.schedule,
  }
}

export function createStripeSubscriptionReconciliationGateway(
  client: Stripe,
): ReconciliationStripeGateway {
  return {
    async listAllSubscriptions() {
      const subscriptions: ReconciliationStripeSubscription[] = []

      for await (const subscription of client.subscriptions.list({
        status: 'all',
        limit: 100,
      })) {
        subscriptions.push(mapStripeSubscription(subscription))
      }

      return subscriptions
    },
    async retrieveCustomerMetadata(customerId) {
      const customer = await client.customers.retrieve(customerId)
      if (customer.deleted) return {}
      return customer.metadata ?? {}
    },
  }
}

export function createPrismaSubscriptionReconciliationStore(): ReconciliationStore {
  return {
    findByStripeSubscriptionId: (stripeSubscriptionId) =>
      prisma.subscription.findFirst({
        where: { stripeSubscriptionId },
      }),
    listWithStripeSubscriptionId: () =>
      prisma.subscription.findMany({
        where: { stripeSubscriptionId: { not: null } },
      }),
    updateStripeDerivedFields: async (id, fields) => {
      await prisma.subscription.update({
        where: { id },
        data: fields,
      })
    },
    createSubscription: async (row) => {
      await prisma.subscription.create({ data: row })
    },
    userExists: async (userId) =>
      Boolean(
        await prisma.user.findFirst({
          where: { id: userId, deletedAt: null },
          select: { id: true },
        }),
      ),
  }
}

export async function runStripeSubscriptionReconciliation(logger: AppLogger) {
  if (!stripeClient) {
    logger.warn('billing.subscription.reconcile.skipped', {
      reason: 'stripe_not_configured',
    })
    return null
  }

  const alertDeps = createStripeSubscriptionReconciliationAlertDeps(logger)

  try {
    const catalog = await readPlanVariantCatalogOrSandbox(stripeClient)
    const plans = buildBetterAuthStripePlansFromPlanVariantCatalog(catalog)

    const result = await reconcileStripeSubscriptions({
      gateway: createStripeSubscriptionReconciliationGateway(stripeClient),
      store: createPrismaSubscriptionReconciliationStore(),
      plans,
      logger: logger as ReconciliationLogger,
      createId: () => randomUUID(),
    })

    await alertStripeSubscriptionReconciliationDrift(result, alertDeps)
    return result
  } catch (error) {
    await alertStripeSubscriptionReconciliationFailure({ error }, alertDeps)
    throw error
  }
}
