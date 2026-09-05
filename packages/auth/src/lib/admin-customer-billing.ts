import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  AdminCustomerBillingValidationError,
  annualFlagForDefaultPlanPriceId,
  billingSnapshotFromPrimarySubscription,
  buildCheckoutCancelReturnUrl,
  buildCheckoutSuccessUrl,
  buildPaidDefaultSubscriptionCreateParams,
  buildPermanentFreeAfterCancellationStripeParams,
  effectiveAssignedPlanVariant,
  type AdminCustomerBillingStore,
  type AdminCustomerBillingStripeGateway,
  type AdminCustomerCyclePlanPort,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import { FREE_PLAN_PRICE_ID } from '../auth-instance.ts'
import {
  createAdminCustomerBillingRuntimeFromPorts,
  type AdminCustomerBillingCheckoutReturnUrls,
  type AdminCustomerBillingRuntime,
} from './admin-customer-billing-runtime.ts'
import { scheduleAssignedVariantCyclePlanChange } from './assigned-variant-cycle-plan-change.ts'
import { buildCheckoutAddressCollectionParams } from './checkout-address-collection.ts'
import { createBetterAuthCyclePlanRestorePort } from './cycle-plan-change.ts'
import {
  readPlanVariantCatalogOrSandbox,
  resolveAssignedPlanVariantChargePrice,
} from './plan-variant-catalog.ts'

export type { AdminCustomerBillingRuntime }

function readStripeSubscriptionPeriodEnd(
  subscription: Stripe.Subscription,
): Date | null {
  const periodEndUnix = (
    subscription as Stripe.Subscription & {
      current_period_end?: number | null
    }
  ).current_period_end
  return periodEndUnix ? new Date(periodEndUnix * 1000) : null
}

function buildAdminCheckoutReturnUrls(
  userId: string,
): AdminCustomerBillingCheckoutReturnUrls {
  const returnUrl = `/user/${userId}/profile?tab=billing`
  return {
    successUrl: buildCheckoutSuccessUrl('subscribe'),
    cancelUrl: buildCheckoutCancelReturnUrl(returnUrl),
  }
}

export function createPrismaAdminCustomerBillingStore(
  client: PrismaClient = prisma,
): AdminCustomerBillingStore {
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
    listSubscriptions: async (userId) => {
      const rows = await client.subscription.findMany({
        where: { referenceId: userId },
        select: {
          id: true,
          plan: true,
          status: true,
          trialEnd: true,
          periodEnd: true,
          endedAt: true,
          canceledAt: true,
          stripeSubscriptionId: true,
          stripeCustomerId: true,
          billingInterval: true,
          periodStart: true,
          cancelAtPeriodEnd: true,
          stripeScheduleId: true,
        },
      })
      return rows
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

      return billingSnapshotFromPrimarySubscription({
        role: user.role,
        stripeCustomerId: user.stripeCustomerId,
        assignedDefaultVariant: effectiveAssignedPlanVariant(
          user.assignedDefaultVariant,
        ),
        subscriptions,
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

export function createStripeAdminCustomerBillingGateway(
  stripeClient: Stripe,
): AdminCustomerBillingStripeGateway {
  return {
    createCustomer: async ({ email, name, metadata }) => {
      const customer = await stripeClient.customers.create({
        email,
        name,
        metadata,
      })
      return { customerId: customer.id }
    },
    customerHasDefaultPaymentMethod: async (customerId) => {
      const customer = await stripeClient.customers.retrieve(customerId)
      if (customer.deleted) return false
      if (customer.invoice_settings?.default_payment_method) return true

      const paymentMethods = await stripeClient.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 1,
      })
      return paymentMethods.data.length > 0
    },
    retrievePaidDefaultSubscription: async (stripeSubscriptionId) => {
      const subscription =
        await stripeClient.subscriptions.retrieve(stripeSubscriptionId)
      const item = subscription.items.data[0]
      if (!item?.id || !item.price?.id) {
        throw new Error('Paid Default subscription is missing a billable item.')
      }

      return {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id,
        subscriptionItemId: item.id,
        currentPriceId: item.price.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        periodEnd: readStripeSubscriptionPeriodEnd(subscription),
      }
    },
    previewPaidPlanChange: async (input) => {
      const preview = await stripeClient.invoices.createPreview({
        customer: input.customerId,
        subscription: input.stripeSubscriptionId,
        subscription_details: {
          items: [
            {
              id: input.subscriptionItemId,
              price: input.newPriceId,
            },
          ],
          proration_behavior: 'create_prorations',
        },
      })

      return {
        prorationAmountCents: preview.total ?? 0,
        currency: preview.currency ?? 'eur',
      }
    },
    createPaidDefaultSubscription: async (input) => {
      const subscription = await stripeClient.subscriptions.create(
        buildPaidDefaultSubscriptionCreateParams(input),
      )
      return { stripeSubscriptionId: subscription.id }
    },
    cancelSubscriptionImmediately: async (stripeSubscriptionId) => {
      const canceled =
        await stripeClient.subscriptions.cancel(stripeSubscriptionId)
      return { stripeSubscriptionId: canceled.id }
    },
    scheduleCancelAtPeriodEnd: async (stripeSubscriptionId) => {
      const updated = await stripeClient.subscriptions.update(
        stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        },
      )
      return { stripeSubscriptionId: updated.id }
    },
    createPermanentFreeSubscription: async (input) => {
      const subscription = await stripeClient.subscriptions.create(
        buildPermanentFreeAfterCancellationStripeParams({
          customerId: input.customerId,
          priceId: input.priceId,
          actorUserId: input.metadata.adminCustomerActorUserId ?? '',
        }),
      )
      return { stripeSubscriptionId: subscription.id }
    },
    createPaidCheckoutSession: async (input) => {
      const session = await stripeClient.checkout.sessions.create({
        customer: input.customerId,
        mode: 'subscription',
        line_items: [{ price: input.priceId, quantity: 1 }],
        payment_method_collection: 'always',
        ...buildCheckoutAddressCollectionParams({ hasCustomer: true }),
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: input.metadata,
        subscription_data: {
          metadata: input.metadata,
        },
      })

      if (!session.url) {
        throw new Error('Stripe Checkout session did not return a URL.')
      }

      return {
        checkoutSessionId: session.id,
        checkoutUrl: session.url,
      }
    },
  }
}

/** Request-scoped Adminboard paid-billing runtime (Prisma, Stripe, Cycle plan). */
export function createAdminCustomerBillingRuntime(deps: {
  prisma?: PrismaClient
  stripeClient: Stripe
  headers: Headers
}): AdminCustomerBillingRuntime {
  const client = deps.prisma ?? prisma
  const betterAuthRestore = createBetterAuthCyclePlanRestorePort(deps.headers)

  const cyclePlan: AdminCustomerCyclePlanPort = {
    scheduleCyclePlanChange: (input) =>
      scheduleAssignedVariantCyclePlanChange({
        stripeClient: deps.stripeClient,
        prisma: client,
        referenceId: input.referenceId,
        annual: input.annual,
      }),
    restore: betterAuthRestore.restore,
  }

  const store = createPrismaAdminCustomerBillingStore(client)
  const stripe = createStripeAdminCustomerBillingGateway(deps.stripeClient)
  const base = createAdminCustomerBillingRuntimeFromPorts({
    store,
    stripe,
    cyclePlan,
    freePlanPriceId: FREE_PLAN_PRICE_ID,
    checkoutReturnUrls: buildAdminCheckoutReturnUrls,
    resolvePlanVariantCatalog: () =>
      readPlanVariantCatalogOrSandbox(deps.stripeClient),
  })

  async function remapTargetPriceId(
    userId: string,
    targetPriceId: string,
  ): Promise<string> {
    const annual = annualFlagForDefaultPlanPriceId(targetPriceId)
    const user = await client.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { assignedDefaultVariant: true },
    })
    const resolved = await resolveAssignedPlanVariantChargePrice({
      stripeClient: deps.stripeClient,
      assignedDefaultVariant: user?.assignedDefaultVariant ?? null,
      annual,
    })
    if (!resolved.ok) {
      throw new AdminCustomerBillingValidationError(
        'Assigned Variant price pair is incomplete or unavailable. Fix the catalog before changing paid plan.',
      )
    }
    return resolved.priceId
  }

  return {
    ...base,
    async previewChangePaidPlan(input) {
      const targetPriceId = await remapTargetPriceId(
        input.userId,
        input.targetPriceId,
      )
      return base.previewChangePaidPlan({ ...input, targetPriceId })
    },
    async changePaidPlan(input) {
      const targetPriceId = await remapTargetPriceId(
        input.userId,
        input.targetPriceId,
      )
      return base.changePaidPlan({ ...input, targetPriceId })
    },
    async sendPaidCheckoutLink(input) {
      const targetPriceId = await remapTargetPriceId(
        input.userId,
        input.targetPriceId,
      )
      return base.sendPaidCheckoutLink({ ...input, targetPriceId })
    },
  }
}
