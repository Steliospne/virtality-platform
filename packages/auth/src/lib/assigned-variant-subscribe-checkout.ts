/**
 * Free / trialing Subscribe: billing portal upgrade using the clinician's
 * Assigned Variant Price ids (Better Auth upgrade only knows the basic pair).
 */

import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  FREE_SUBSCRIPTION_PLAN,
  isLiveEntitlementSubscriptionStatus,
  toAbsoluteConsoleReturnUrl,
  type AssignedVariantSubscribeCheckoutResult,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import { resolveAssignedProVariantChargePrice } from './pro-variant-catalog.ts'

export async function startAssignedVariantSubscribeCheckout(input: {
  stripeClient: Stripe
  prisma?: PrismaClient
  referenceId: string
  annual: boolean
  returnUrl: string
}): Promise<AssignedVariantSubscribeCheckoutResult> {
  const client = input.prisma ?? prisma
  const absoluteReturnUrl = toAbsoluteConsoleReturnUrl(input.returnUrl)

  const user = await client.user.findFirst({
    where: { id: input.referenceId, deletedAt: null },
    select: {
      id: true,
      assignedProVariant: true,
      stripeCustomerId: true,
    },
  })
  if (!user) {
    return { ok: false, message: 'Customer not found.' }
  }
  if (!user.stripeCustomerId) {
    return {
      ok: false,
      message: 'Stripe customer is required before Subscribe.',
    }
  }

  const priceResolved = await resolveAssignedProVariantChargePrice({
    stripeClient: input.stripeClient,
    assignedProVariant: user.assignedProVariant,
    annual: input.annual,
  })
  if (!priceResolved.ok) {
    return {
      ok: false,
      message:
        'Assigned Variant price pair is incomplete or unavailable. Fix the catalog before Checkout.',
    }
  }

  const subscription = await client.subscription.findFirst({
    where: {
      referenceId: user.id,
      plan: FREE_SUBSCRIPTION_PLAN,
      status: { in: ['active', 'trialing'] },
      stripeSubscriptionId: { not: null },
    },
    orderBy: { id: 'desc' },
    select: {
      id: true,
      status: true,
      stripeSubscriptionId: true,
    },
  })

  if (
    !subscription?.stripeSubscriptionId ||
    !isLiveEntitlementSubscriptionStatus(subscription.status)
  ) {
    return {
      ok: false,
      message: 'Subscribe requires a live Free subscription.',
    }
  }

  const stripeSub = await input.stripeClient.subscriptions.retrieve(
    subscription.stripeSubscriptionId,
  )
  const planItem = stripeSub.items.data[0]
  if (!planItem) {
    return { ok: false, message: 'Subscription has no Price item to change.' }
  }

  try {
    const portalSession =
      await input.stripeClient.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: absoluteReturnUrl,
        flow_data: {
          type: 'subscription_update_confirm',
          after_completion: {
            type: 'redirect',
            redirect: { return_url: absoluteReturnUrl },
          },
          subscription_update_confirm: {
            subscription: stripeSub.id,
            items: [
              {
                id: planItem.id,
                price: priceResolved.priceId,
                quantity: 1,
              },
            ],
          },
        },
      })

    if (!portalSession.url) {
      return {
        ok: false,
        message: 'Stripe billing portal did not return a URL.',
      }
    }

    return { ok: true, checkoutUrl: portalSession.url }
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to start Subscribe checkout'
    return { ok: false, message }
  }
}
