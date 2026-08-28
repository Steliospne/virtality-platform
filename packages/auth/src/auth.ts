import { createStripeCouponLibraryGateway } from './lib/coupon-library.ts'
import { createStripePromotionCodeGateway } from './lib/promotion-code.ts'
import {
  buildCampaignAwareCheckoutSessionParams,
  closeCampaignWindowForAdminboard,
  loadCampaignWindowView,
  upsertCampaignWindowForAdminboard,
} from './lib/campaign-window.ts'
import {
  loadConsolePromoRedeemPreflightForUser,
  readConsoleSubscriptionDiscountForUser,
  redeemPromotionCodeForUser,
  removePromoDiscountForUser,
} from './lib/console-promo-redeem.ts'
import {
  cancelPendingPromotionCodeForCheckout,
  savePendingPromotionCodeForCheckout,
  type PendingPromotionCodeCouponTerms,
} from './lib/pending-promotion-code.ts'
import { prisma } from '@virtality/db'
import Stripe from 'stripe'
import {
  archiveLibraryCoupon,
  createLibraryCoupon,
  createPromotionCode,
  deactivatePromotionCode,
  deleteLibraryCoupon,
  listLibraryCoupons,
  listPromotionCodesForCoupon,
  notifyPromotionCodeDelivery,
  sendPromotionCodeEmail,
  updateLibraryCouponName,
  type CreateLibraryCouponInput,
  type CreatePromotionCodeInput,
  type NotifyPromotionCodeDeliveryInput,
  type PromotionCodeDeliveryStore,
  type SendPromotionCodeEmailInput,
  type SendPromotionCodeEmailRuntime,
  type UpdateLibraryCouponNameInput,
} from '@virtality/shared/utils'
import { stripeClient } from './auth-instance.ts'
import { readConsoleBillingCatalogOrSandbox } from './lib/billing-catalog.ts'

export {
  auth,
  FREE_PLAN_PRICE_ID,
  PRO_PLAN_ANNUAL_PRICE_ID,
  PRO_PLAN_PRICE_ID,
} from './auth-instance.ts'
export type { AuthContext, AuthSession, AuthUser } from './lib/auth-context.ts'
export { asAuthSession } from './lib/auth-context.ts'
export {
  createPrismaAdminCustomerAccessStore,
  createStripeAdminCustomerAccessGateway,
} from './lib/admin-customer-access.ts'
export {
  createAdminCustomerBillingRuntime,
  createPrismaAdminCustomerBillingStore,
  createStripeAdminCustomerBillingGateway,
} from './lib/admin-customer-billing.ts'
export type { AdminCustomerBillingRuntime } from './lib/admin-customer-billing.ts'
export { createAdminEntitlementClockRuntime } from './lib/admin-entitlement-clock.ts'
export type { AdminEntitlementClockRuntime } from './lib/admin-entitlement-clock.ts'
export {
  createPrismaEntitlementExtensionStore,
  createStripeEntitlementExtensionGateway,
} from './lib/entitlement-extension.ts'
export {
  createPrismaRenewPromptDeliveryStore,
  createPrismaRenewTriggerStore,
  createRenewPromptLifecycle,
} from './lib/renew-prompt-lifecycle.ts'
export type {
  RenewPromptLifecycle,
  RenewPromptLifecycleDeps,
} from './lib/renew-prompt-lifecycle.ts'
export {
  createPrismaCampaignRegistry,
  createStripeSubscriptionDiscountGateway,
  isCampaignCouponId,
  readLiveSubscriptionDiscount,
  registerCampaignCouponId,
} from './lib/subscription-discount-read.ts'
export {
  buildCampaignAwareCheckoutSessionParams,
  closeCampaignWindowForAdminboard,
  createPrismaCampaignWindowStore,
  loadCampaignWindowView,
  upsertCampaignWindowForAdminboard,
} from './lib/campaign-window.ts'
export {
  createConsolePromoReadGateway,
  createPrismaConsolePromoStore,
  createStripeConsolePromoGateway,
  loadConsolePromoRedeemPreflightForUser,
  readConsoleSubscriptionDiscountForUser,
  redeemPromotionCodeForUser,
  removePromoDiscountForUser,
} from './lib/console-promo-redeem.ts'
export { createStripeCouponLibraryGateway }
export { createStripePromotionCodeGateway }
export type { PendingPromotionCodeCouponTerms }

function requireStripeClient(): Stripe {
  if (!stripeClient) {
    throw new Error(
      'Stripe is not configured. Set STRIPE_SECRET_KEY to use Coupon library.',
    )
  }
  return stripeClient
}

/** Stripe client for request-scoped runtimes (e.g. Admin customer billing). */
export { requireStripeClient as getRequiredStripeClient }

function couponLibraryGateway() {
  return createStripeCouponLibraryGateway(requireStripeClient())
}

function promotionCodeGateway() {
  return createStripePromotionCodeGateway(requireStripeClient())
}

/** Adminboard Coupon library: create against live Stripe Coupons. */
export function createLibraryCouponForAdminboard(
  input: CreateLibraryCouponInput,
) {
  return createLibraryCoupon(couponLibraryGateway(), input)
}

export function listLibraryCouponsForAdminboard() {
  return listLibraryCoupons(couponLibraryGateway())
}

export function updateLibraryCouponNameForAdminboard(
  input: UpdateLibraryCouponNameInput,
) {
  return updateLibraryCouponName(couponLibraryGateway(), input)
}

export function archiveLibraryCouponForAdminboard(id: string) {
  return archiveLibraryCoupon(couponLibraryGateway(), id)
}

export function deleteLibraryCouponForAdminboard(id: string) {
  return deleteLibraryCoupon(couponLibraryGateway(), id)
}

/** Adminboard Promotion Codes nested under a library Coupon. */
export function createPromotionCodeForAdminboard(
  input: CreatePromotionCodeInput,
) {
  return createPromotionCode(promotionCodeGateway(), input)
}

export function listPromotionCodesForCouponForAdminboard(couponId: string) {
  return listPromotionCodesForCoupon(promotionCodeGateway(), couponId)
}

export function deactivatePromotionCodeForAdminboard(id: string) {
  return deactivatePromotionCode(promotionCodeGateway(), id)
}

export function sendPromotionCodeEmailForAdminboard(
  input: SendPromotionCodeEmailInput,
  runtime: SendPromotionCodeEmailRuntime,
) {
  return sendPromotionCodeEmail(promotionCodeGateway(), input, runtime)
}

export function notifyPromotionCodeDeliveryForAdminboard(
  store: PromotionCodeDeliveryStore,
  input: NotifyPromotionCodeDeliveryInput,
) {
  return notifyPromotionCodeDelivery(promotionCodeGateway(), store, input)
}

/** Adminboard Campaign Window: read singleton + Coupon health / attaching. */
export function getCampaignWindowForAdminboard() {
  return loadCampaignWindowView({ stripeClient: requireStripeClient() })
}

/** Adminboard Campaign Window: upsert singleton and register Coupon id. */
export function saveCampaignWindowForAdminboard(input: {
  couponId: string
  startsAt: Date
  endsAt: Date
}) {
  return upsertCampaignWindowForAdminboard(input, {
    stripeClient: requireStripeClient(),
  })
}

/** Adminboard Campaign Window: close to stop new Checkout attaches. */
export function closeCampaignWindowAction() {
  return closeCampaignWindowForAdminboard()
}

function requireStripeForConsolePromo(): Stripe {
  if (!stripeClient) {
    throw new Error(
      'Stripe is not configured. Set STRIPE_SECRET_KEY to redeem Promotion Codes.',
    )
  }
  return stripeClient
}

/** Console Billing: live Subscription Discount read for display + chrome. */
export function readConsoleSubscriptionDiscountAction(userId: string) {
  return readConsoleSubscriptionDiscountForUser(userId, {
    prisma,
    stripeClient: requireStripeForConsolePromo(),
  })
}

/** Console Billing: Pro catalog list prices from canonical Stripe Prices. */
export function readConsoleBillingCatalogAction() {
  return readConsoleBillingCatalogOrSandbox(stripeClient)
}

/** Console Billing: redeem preflight (staff-block / replace-confirm). */
export function loadConsolePromoRedeemPreflightAction(userId: string) {
  return loadConsolePromoRedeemPreflightForUser(
    { userId },
    {
      prisma,
      stripeClient: requireStripeForConsolePromo(),
    },
  )
}

/** Console Billing: mid-cycle Promotion Code redeem. */
export function redeemPromotionCodeAction(input: {
  userId: string
  code: string
  confirmReplace: boolean
}) {
  return redeemPromotionCodeForUser(input, {
    prisma,
    stripeClient: requireStripeForConsolePromo(),
  })
}

/** Console Billing: clinician self-remove of promo Discount only. */
export function removePromoDiscountAction(input: { userId: string }) {
  return removePromoDiscountForUser(input, {
    prisma,
    stripeClient: requireStripeForConsolePromo(),
  })
}

/** Console Billing: save Promotion Code for the next Checkout session. */
export function savePendingPromotionCodeAction(input: {
  userId: string
  code: string
}) {
  return savePendingPromotionCodeForCheckout(input, {
    prisma,
    stripeClient: requireStripeForConsolePromo(),
  })
}

/** Console Billing: cancel a pending Promotion Code after Checkout cancel. */
export function cancelPendingPromotionCodeAction(input: { userId: string }) {
  return cancelPendingPromotionCodeForCheckout(input, {
    prisma,
  })
}
