import { betterAuth } from 'better-auth'
import {
  EmailData,
  sendDeleteAccountVerification,
  sendResetPassword,
  sendVerificationEmail,
} from '@virtality/nodemailer'
import { createAuthMiddleware, getOAuthState } from 'better-auth/api'
import validateAndConsumeReferralCode from './lib/referral-code.ts'
import { updateUserRole } from './data/user.ts'
import { prisma } from '@virtality/db'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, organization, phoneNumber } from 'better-auth/plugins'
import { stripe } from '@better-auth/stripe'
import Stripe from 'stripe'
import { ac, roles } from './permissions.ts'
import {
  SERVER_URL,
  SERVER_URL_LOCAL,
  SERVER_URL_STAGING,
} from '@virtality/shared/types'

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const env = process.env.ENV || 'development'

const baseURL =
  env === 'production'
    ? SERVER_URL
    : env === 'preview'
      ? SERVER_URL_STAGING
      : SERVER_URL_LOCAL

export const auth = betterAuth({
  appName: 'virtality',
  baseURL,
  basePath: '/api/v1/auth',
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  account: { accountLinking: { enabled: true } },
  user: {
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
      subscription: {
        enabled: true,
        plans: [{ name: 'pro', priceId: 'price_1RfNGh4Fc2DAAhEfvoXDrDMw' }],
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
            const referralCode = ctx.body?.referralCode

            const isValid = await validateAndConsumeReferralCode(
              referralCode,
              user.id,
            )

            if (isValid) {
              await updateUserRole(user.id, 'tester')
            }
          }

          if (ctx?.path === '/callback/:id') {
            const additionalData = await getOAuthState()

            const isValid = await validateAndConsumeReferralCode(
              additionalData?.referralCode,
              user.id,
            )

            if (isValid) {
              await updateUserRole(user.id, 'tester')
            }
          }
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const {
        path,
        context: { newSession },
      } = ctx

      if (path.startsWith('/sign-up')) {
        const newSession = ctx.context.newSession
        const re = ctx.body?.re

        if (newSession?.user && re && typeof re === 'string') {
          const isValid = await validateAndConsumeReferralCode(
            re,
            newSession.user.id,
          )

          if (isValid) {
            await updateUserRole(newSession.user.id, 'tester')
          }
        }
      }

      if (path.startsWith('/callback/:id')) {
        const additionalData = await getOAuthState()

        if (newSession?.user?.id && additionalData?.referralCode) {
          const isValid = await validateAndConsumeReferralCode(
            additionalData?.referralCode,
            newSession?.user?.id,
          )

          if (isValid) {
            await updateUserRole(newSession.user.id, 'tester')
          }
        }
      }
    }),
  },
})

export type { AuthContext } from './lib/auth-context.ts'
