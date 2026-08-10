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
import { updateUserRole } from './data/user.ts'
import { prisma } from '@virtality/db'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, organization, phoneNumber } from 'better-auth/plugins'
import { stripe } from '@better-auth/stripe'
import Stripe from 'stripe'
import { ac, roles } from './permissions.ts'
import { getServerUrl } from '@virtality/shared/types'
import { routeSignUpCode } from '@virtality/shared/utils'

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

/**
 * Canonical sandbox `pro` monthly Price (`prod_SaYNooLgBNvYvA` default;
 * lookup_key `pro_monthly`). Same ID for no-card Trial Subscription create
 * and Checkout subscribe/renew. Retired inactive auth price:
 * `price_1RfNGh4Fc2DAAhEfvoXDrDMw` (€80).
 */
export const PRO_PLAN_PRICE_ID = 'price_1SeVrm4Fc2DAAhEfIWIRZ2v9' as const

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
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      accessType: 'offline',
      prompt: 'select_account consent',
      mapProfileToUser: async (profile) => {
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
  },
  plugins: [
    admin({ ac, roles }),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      onCustomerCreate: async ({ stripeCustomer, user }, ctx) => {
        let rawCode = readSignUpCodeFromUnknown(ctx.body)
        if (
          rawCode === undefined &&
          typeof ctx.path === 'string' &&
          ctx.path.startsWith('/callback')
        ) {
          rawCode = readSignUpCodeFromUnknown(
            await getOAuthState().catch(() => null),
          )
        }

        await redeemTrialCodeForCustomer({
          rawCode,
          userId: user.id,
          stripeCustomerId: stripeCustomer.id,
          priceId: PRO_PLAN_PRICE_ID,
          stripeClient,
        })
      },
      subscription: {
        enabled: true,
        plans: [{ name: 'pro', priceId: PRO_PLAN_PRICE_ID }],
      },
    }),
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
            const additionalData = await getOAuthState()
            await consumeTesterCodeIfPresent(
              readSignUpCodeFromUnknown(additionalData),
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
        const additionalData = await getOAuthState().catch(() => null)
        await assertTrialRedeemAllowedAtSignUp(
          readSignUpCodeFromUnknown(additionalData),
        )
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const {
        path,
        context: { newSession },
      } = ctx

      if (path.startsWith('/sign-up')) {
        const newSession = ctx.context.newSession
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

export type { AuthContext } from './lib/auth-context.ts'
