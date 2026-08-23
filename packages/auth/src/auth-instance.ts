import { betterAuth } from 'better-auth'
import {
  sendDeleteAccountVerification,
  sendResetPassword,
  sendVerificationEmail,
} from '@virtality/nodemailer'
import { APIError, createAuthMiddleware, getOAuthState } from 'better-auth/api'
import validateAndConsumeTesterCode from './lib/tester-code.ts'
import {
  assertTrialRedeemAllowedAtSignUp,
  readSignUpCodeFromUnknown,
  redeemTrialCodeForCustomer,
} from './lib/trial-redeem.ts'
import { rearmRenewPromptsAfterCheckoutSubscription } from './lib/renew-prompt-epoch.ts'
import { buildCampaignAwareCheckoutSessionParams } from './lib/campaign-window.ts'
import { getOpenPendingPromotionCodeForCheckout } from './lib/pending-promotion-code.ts'
import { updateUserRole } from './data/user.ts'
import { prisma } from '@virtality/db'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, organization, phoneNumber } from 'better-auth/plugins'
import { stripe } from '@better-auth/stripe'
import Stripe from 'stripe'
import { ac, roles } from './permissions.ts'
import { getServerUrl } from '@virtality/shared/types'
import {
  FREE_PLAN_PRICE_ID,
  FREE_SUBSCRIPTION_PLAN,
  PRO_PLAN_MONTHLY_PRICE_ID,
  PRO_SUBSCRIPTION_PLAN,
  isPasswordValid,
  routeSignUpCode,
} from '@virtality/shared/utils'

const runtimeEnv =
  process.env.ENV ?? process.env.NEXT_PUBLIC_ENV ?? 'development'
const isDevelopment = runtimeEnv === 'development'
const authCookieNameSuffix = runtimeEnv === 'preview' ? '_preview' : ''
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim()

if (!stripeSecretKey && !isDevelopment) {
  throw new Error('STRIPE_SECRET_KEY is required outside development')
}

export const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    })
  : null

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
const googleEnabled = Boolean(googleClientId && googleClientSecret)

/**
 * Canonical sandbox `pro` monthly Price (`prod_SaYNooLgBNvYvA` default;
 * lookup_key `pro_monthly`). Checkout subscribe/renew only. Retired inactive
 * auth price: `price_1RfNGh4Fc2DAAhEfvoXDrDMw` (€80).
 * Trial Redeem uses {@link FREE_PLAN_PRICE_ID} instead.
 * Alias for {@link PRO_PLAN_MONTHLY_PRICE_ID} in `@virtality/shared`.
 */
export const PRO_PLAN_PRICE_ID = PRO_PLAN_MONTHLY_PRICE_ID

/**
 * Canonical sandbox `pro` yearly Price on the same Product
 * (`lookup_key: pro_yearly`). Provisional amount (€1500/year = 10× monthly
 * €150) until live amounts are locked. Trial Redeem / Extension keep monthly.
 */
export const PRO_PLAN_ANNUAL_PRICE_ID =
  'price_1U3f2g4Fc2DAAhEfk5EkH3u1' as const

export { FREE_PLAN_PRICE_ID }

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
    autoSignInAfterVerification: true,
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
                priceId: FREE_PLAN_PRICE_ID,
                stripeClient,
              })
            },
            subscription: {
              enabled: true,
              plans: [
                {
                  name: FREE_SUBSCRIPTION_PLAN,
                  priceId: FREE_PLAN_PRICE_ID,
                },
                {
                  name: PRO_SUBSCRIPTION_PLAN,
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
                const checkoutParams =
                  await buildCampaignAwareCheckoutSessionParams({
                    userId: user.id,
                    stripeCustomerId:
                      typeof user.stripeCustomerId === 'string'
                        ? user.stripeCustomerId
                        : null,
                    stripeClient,
                  })
                const pendingPromotionCode =
                  await getOpenPendingPromotionCodeForCheckout(
                    { userId: user.id },
                    { prisma, stripeClient },
                  )
                if (!pendingPromotionCode) {
                  return checkoutParams
                }
                return {
                  params: {
                    ...checkoutParams.params,
                    discounts: [
                      {
                        promotion_code: pendingPromotionCode.promotionCodeId,
                      },
                    ],
                  },
                }
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
      session_token: { name: `virtality${authCookieNameSuffix}_session` },
      admin_session: {
        name: `virtality${authCookieNameSuffix}_admin_session`,
      },
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

      if (
        path === '/sign-up/email' &&
        (typeof ctx.body?.password !== 'string' ||
          !isPasswordValid(ctx.body.password))
      ) {
        throw new APIError('BAD_REQUEST', {
          message:
            'Password must be 8-16 characters with at least one uppercase letter, lowercase letter, and digit.',
        })
      }

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
