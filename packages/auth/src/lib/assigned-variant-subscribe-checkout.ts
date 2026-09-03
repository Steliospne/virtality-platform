/**
 * Free / trialing Subscribe: Stripe Checkout with the clinician's Assigned
 * Variant Price ids. Billing Portal cannot list every variant Price, so this
 * bypasses Better Auth's basic `pro` upgrade the same way never-subscribed
 * Checkout uses `getCheckoutSessionParams` line_items overrides.
 */

import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import { API_PREFIX, getServerUrl } from '@virtality/shared/types'
import {
  FREE_SUBSCRIPTION_PLAN,
  buildCheckoutCancelReturnUrl,
  buildCheckoutSuccessUrl,
  isLiveEntitlementSubscriptionStatus,
  toAbsoluteConsoleReturnUrl,
  type AssignedVariantSubscribeCheckoutResult,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import { buildCampaignAwareCheckoutSessionParams } from './campaign-window.ts'
import { buildCheckoutAddressCollectionParams } from './checkout-address-collection.ts'
import { resolvePromotionCodeForNewCheckout } from './console-promo-redeem.ts'
import { resolveAssignedPlanVariantChargePrice } from './plan-variant-catalog.ts'

/** Stripe metadata: cancel the prior Free subscription after paid Checkout. */
export const ASSIGNED_VARIANT_CANCEL_STRIPE_SUB_METADATA_KEY =
  'virtalityCancelStripeSubscriptionId' as const

function buildBetterAuthCheckoutSuccessUrl(successUrl: string): string {
  const authBase = `${getServerUrl()}${API_PREFIX}/auth`
  return `${authBase}/subscription/success?callbackURL=${encodeURIComponent(successUrl)}&checkoutSessionId={CHECKOUT_SESSION_ID}`
}

export async function startAssignedVariantSubscribeCheckout(input: {
  stripeClient: Stripe
  prisma?: PrismaClient
  referenceId: string
  annual: boolean
  returnUrl: string
}): Promise<AssignedVariantSubscribeCheckoutResult> {
  const client = input.prisma ?? prisma
  const successUrl = buildCheckoutSuccessUrl('subscribe')
  const cancelUrl = buildCheckoutCancelReturnUrl(input.returnUrl)

  const user = await client.user.findFirst({
    where: { id: input.referenceId, deletedAt: null },
    select: {
      id: true,
      assignedDefaultVariant: true,
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

  const priceResolved = await resolveAssignedPlanVariantChargePrice({
    stripeClient: input.stripeClient,
    assignedDefaultVariant: user.assignedDefaultVariant,
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

  try {
    const { params: campaignParams } =
      await buildCampaignAwareCheckoutSessionParams({
        userId: user.id,
        stripeCustomerId: user.stripeCustomerId,
        stripeClient: input.stripeClient,
        prisma: client,
      })

    const lineItemsOverride = {
      line_items: [{ price: priceResolved.priceId, quantity: 1 }],
    }

    const pendingPromotionCode = await resolvePromotionCodeForNewCheckout(
      { userId: user.id },
      { prisma: client, stripeClient: input.stripeClient },
    )

    const addressCollectionParams = buildCheckoutAddressCollectionParams({
      hasCustomer: true,
    })

    const checkoutParams = pendingPromotionCode
      ? {
          ...campaignParams,
          ...addressCollectionParams,
          ...lineItemsOverride,
          discounts: [{ promotion_code: pendingPromotionCode.promotionCodeId }],
        }
      : {
          ...campaignParams,
          ...addressCollectionParams,
          ...lineItemsOverride,
        }

    const metadata = {
      userId: user.id,
      subscriptionId: subscription.id,
      referenceId: user.id,
      [ASSIGNED_VARIANT_CANCEL_STRIPE_SUB_METADATA_KEY]:
        subscription.stripeSubscriptionId,
    }

    const session = await input.stripeClient.checkout.sessions.create({
      customer: user.stripeCustomerId,
      mode: 'subscription',
      success_url: buildBetterAuthCheckoutSuccessUrl(
        toAbsoluteConsoleReturnUrl(successUrl),
      ),
      cancel_url: toAbsoluteConsoleReturnUrl(cancelUrl),
      client_reference_id: user.id,
      ...checkoutParams,
      subscription_data: { metadata },
      metadata,
    })

    if (!session.url) {
      return {
        ok: false,
        message: 'Stripe Checkout session did not return a URL.',
      }
    }

    return { ok: true, checkoutUrl: session.url }
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to start Subscribe checkout'
    return { ok: false, message }
  }
}
