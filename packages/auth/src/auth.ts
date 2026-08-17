import { betterAuth } from 'better-auth'
import {
  EmailData,
  sendDeleteAccountVerification,
  sendResetPassword,
  sendVerificationEmail,
  sendChangeEmailConfirmation,
} from '@virtality/nodemailer'
import { createAuthMiddleware, getOAuthState } from 'better-auth/api'
import validateAndConsumeTesterCode from './lib/tester-code.ts'
import {
  assertTrialRedeemAllowedAtSignUp,
  readSignUpCodeFromUnknown,
  redeemTrialCodeForCustomer,
} from './lib/trial-redeem.ts'
import { extendEntitlementClockForAdminboard } from './lib/entitlement-extension.ts'
import { rearmRenewPromptsAfterCheckoutSubscription } from './lib/renew-prompt-epoch.ts'
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
import { updateUserRole } from './data/user.ts'
import { prisma } from '@virtality/db'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, organization, phoneNumber } from 'better-auth/plugins'
import { stripe } from '@better-auth/stripe'
import Stripe from 'stripe'
import { ac, roles } from './permissions.ts'
import { getServerUrl } from '@virtality/shared/types'
import {
  archiveLibraryCoupon,
  createLibraryCoupon,
  createPromotionCode,
  deactivatePromotionCode,
  deleteLibraryCoupon,
  listLibraryCoupons,
  listPromotionCodesForCoupon,
  notifyPromotionCodeDelivery,
  routeSignUpCode,
  sendPromotionCodeEmail,
  updateLibraryCouponName,
  type CreateLibraryCouponInput,
  type CreatePromotionCodeInput,
  type ExtendLiveEntitlementClockInput,
  type NotifyPromotionCodeDeliveryInput,
  type PromotionCodeDeliveryStore,
  type SendPromotionCodeEmailInput,
  type SendPromotionCodeEmailRuntime,
  type UpdateLibraryCouponNameInput,
} from '@virtality/shared/utils'

const runtimeEnv =
  process.env.ENV ?? process.env.NEXT_PUBLIC_ENV ?? 'development'
const isDevelopment = runtimeEnv === 'development'
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim()

if (!stripeSecretKey && !isDevelopment) {
  throw new Error('STRIPE_SECRET_KEY is required outside development')
}

const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    })
  : null

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
const googleEnabled = Boolean(googleClientId && googleClientSecret)

/**
 * Canonical sandbox `pro` monthly Price (`prod_SaYNooLgBNvYvA` default;
 * lookup_key `pro_monthly`). Same ID for no-card Trial Subscription create
 * and Checkout subscribe/renew. Retired inactive auth price:
 * `price_1RfNGh4Fc2DAAhEfvoXDrDMw` (€80).
 */
export const PRO_PLAN_PRICE_ID = 'price_1SeVrm4Fc2DAAhEfIWIRZ2v9' as const

/**
 * Canonical sandbox `pro` yearly Price on the same Product
 * (`lookup_key: pro_yearly`). Provisional amount (€1500/year = 10× monthly
 * €150) until live amounts are locked. Trial Redeem / Extension keep monthly.
 */
export const PRO_PLAN_ANNUAL_PRICE_ID =
  'price_1U3f2g4Fc2DAAhEfk5EkH3u1' as const

const baseURL = getServerUrl()

async function consumeTesterCodeIfPresent(
  rawCode: string | null | undefined,
  userId: string,
): Promise<void> {
  const routed = routeSignUpCode(rawCode)
  if (routed.kind !== 'tester') return

  const isValid = await validateAndConsumeTesterCode(routed.code, userId)
  if (isValid) {
    await updateUserRole(userId, 'tester')
  }
}

async function readSignUpCodeFromOAuthState(): Promise<string | undefined> {
  return readSignUpCodeFromUnknown(await getOAuthState().catch(() => null))
}

async function resolveSignUpCodeForCustomerCreate(
  body: unknown,
  path: unknown,
): Promise<string | undefined> {
  const fromBody = readSignUpCodeFromUnknown(body)
  if (fromBody !== undefined) return fromBody

  if (typeof path === 'string' && path.startsWith('/callback')) {
    return readSignUpCodeFromOAuthState()
  }

  return undefined
}

export const auth = betterAuth({
  appName: 'virtality',
  baseURL,
  basePath: '/api/v1/auth',
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  account: { accountLinking: { enabled: true, allowDifferentEmails: true } },
  user: {
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification,
    },
  },
  session: {
    expiresIn: 14 * 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword,
  },
  emailVerification: {
    sendVerificationEmail,
  },
  socialProviders: {
    ...(googleEnabled
      ? {
          google: {
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
            accessType: 'offline' as const,
            prompt: 'select_account consent' as const,
            mapProfileToUser: async (profile: {
              email: string
              picture?: string | null
            }) => {
              const { email, picture } = profile
              const existingUser = await prisma.user.findFirst({
                where: { email },
              })

              if (!existingUser) return

              if (picture && !existingUser.image) {
                await prisma.user.update({
                  where: { id: existingUser.id },
                  data: { ...existingUser, image: picture },
                })
              }
            },
          },
        }
      : {}),
  },
  plugins: [
    admin({ ac, roles }),
    ...(stripeClient
      ? [
          stripe({
            stripeClient,
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
            createCustomerOnSignUp: true,
            onCustomerCreate: async ({ stripeCustomer, user }, ctx) => {
              await redeemTrialCodeForCustomer({
                rawCode: await resolveSignUpCodeForCustomerCreate(
                  ctx.body,
                  ctx.path,
                ),
                userId: user.id,
                stripeCustomerId: stripeCustomer.id,
                priceId: PRO_PLAN_PRICE_ID,
                stripeClient,
              })
            },
            subscription: {
              enabled: true,
              plans: [
                {
                  name: 'pro',
                  priceId: PRO_PLAN_PRICE_ID,
                  annualDiscountPriceId: PRO_PLAN_ANNUAL_PRICE_ID,
                },
              ],
              // Paid Subscribe/Renew Checkout always collects a card. No-card trials
              // stay on the Trial Redeem / Extension Stripe create path, not Checkout.
              // Campaign Window may attach discounts[{coupon}] for Subscribe only
              // (!hadPaidBilling); never allow_promotion_codes on the same Session.
              getCheckoutSessionParams: async ({ user }) => {
                if (!stripeClient) {
                  return {
                    params: {
                      payment_method_collection: 'always' as const,
                    },
                  }
                }
                return buildCampaignAwareCheckoutSessionParams({
                  userId: user.id,
                  stripeCustomerId:
                    typeof user.stripeCustomerId === 'string'
                      ? user.stripeCustomerId
                      : null,
                  stripeClient,
                })
              },
              // Successful Subscribe/Renew Checkout starts a new renew epoch.
              onSubscriptionComplete: async ({ subscription }) => {
                await rearmRenewPromptsAfterCheckoutSubscription(
                  prisma,
                  subscription,
                )
              },
              // Extension (and other live clock-end changes) sync via webhook update.
              onSubscriptionUpdate: async ({ subscription }) => {
                await rearmRenewPromptsAfterCheckoutSubscription(
                  prisma,
                  subscription,
                )
              },
            },
          }),
        ]
      : []),
    phoneNumber({
      expiresIn: 5 * 60,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sendOTP: async ({ phoneNumber, code }) => {
        // Implement sending OTP code via SMS
      },
    }),
    organization(),
  ],
  advanced: {
    cookies: {
      session_token: { name: 'virtality_session' },
      admin_session: { name: 'virtality_admin_session' },
    },
    crossSubDomainCookies: {
      enabled: true,
      domain:
        process.env.ENV === 'development' ? 'localhost' : `.virtality.app`,
    },
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: 'none',
    },
  },
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://*.virtality.app',
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user, ctx) => {
          if (ctx?.path === '/sign-up/email') {
            await consumeTesterCodeIfPresent(ctx.body?.testerCode, user.id)
          }

          if (ctx?.path === '/callback/:id') {
            await consumeTesterCodeIfPresent(
              readSignUpCodeFromUnknown(await getOAuthState()),
              user.id,
            )
          }
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const { path } = ctx

      if (path.startsWith('/sign-up')) {
        await assertTrialRedeemAllowedAtSignUp(
          readSignUpCodeFromUnknown(ctx.body),
        )
      }

      if (path.startsWith('/callback/:id')) {
        // Skip empty: returning Google sign-in has no code. Empty email
        // sign-up waitlists via /sign-up above; PAY-/expired still gated here.
        const oauthCode = await readSignUpCodeFromOAuthState()
        if (oauthCode?.trim()) {
          await assertTrialRedeemAllowedAtSignUp(oauthCode)
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const {
        path,
        context: { newSession },
      } = ctx

      if (path.startsWith('/sign-up')) {
        const re = ctx.body?.re
        if (newSession?.user && re && typeof re === 'string') {
          await consumeTesterCodeIfPresent(re, newSession.user.id)
        }
      }

      if (path.startsWith('/callback/:id')) {
        const additionalData = await getOAuthState()
        if (newSession?.user?.id) {
          await consumeTesterCodeIfPresent(
            readSignUpCodeFromUnknown(additionalData),
            newSession.user.id,
          )
        }
      }
    }),
  },
})

export type { AuthContext, AuthSession, AuthUser } from './lib/auth-context.ts'
export { asAuthSession } from './lib/auth-context.ts'
export {
  createPrismaEntitlementExtensionStore,
  createStripeEntitlementExtensionGateway,
  extendEntitlementClockForAdminboard,
} from './lib/entitlement-extension.ts'
export {
  createPrismaRenewPromptDeliveryStore,
  rearmRenewPromptsAfterCheckoutSubscription,
  rearmRenewPromptsAfterExtension,
  rearmRenewPromptsForNewClockEnd,
} from './lib/renew-prompt-epoch.ts'
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

function requireStripeClient(): Stripe {
  if (!stripeClient) {
    throw new Error(
      'Stripe is not configured. Set STRIPE_SECRET_KEY to use Coupon library.',
    )
  }
  return stripeClient
}

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

/**
 * Adminboard Extension: update live trialing|active, else create a no-card
 * Trial Subscription (closes over platform Stripe + canonical pro Price).
 */
export function extendEntitlementClockAction(
  client: typeof prisma,
  input: ExtendLiveEntitlementClockInput,
) {
  if (!stripeClient) {
    throw new Error(
      'Stripe is not configured. Set STRIPE_SECRET_KEY to use entitlement extension.',
    )
  }

  return extendEntitlementClockForAdminboard(
    { ...input, priceId: PRO_PLAN_PRICE_ID },
    {
      prisma: client,
      stripeClient,
    },
  )
}

/** @deprecated Prefer extendEntitlementClockAction. */
export const extendLiveEntitlementClockAction = extendEntitlementClockAction
