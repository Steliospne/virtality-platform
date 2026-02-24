import { betterAuth } from 'better-auth'
import { admin, organization, phoneNumber } from 'better-auth/plugins'
import { stripe } from '@better-auth/stripe'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { createAuthMiddleware, getOAuthState } from 'better-auth/api'
import Stripe from 'stripe'
import { toPlainText } from '@react-email/render'
import EmailVerification from '@virtality/ui/components/email/email-verification'
import ResetPassword from '@virtality/ui/components/email/reset-password'
import DeleteUserEmail from '@virtality/ui/components/email/delete-user-email'
import { prisma } from '@virtality/db'
import { ac, roles } from './permissions.ts'
import { transporter } from './nodemailer.ts'
import { reactToHTML } from './lib/react-to-email.ts'
import validateAndConsumeReferralCode from './lib/referral-code.ts'
import { updateUserRole } from './data/user.ts'

const DOMAIN = process.env.BETTER_AUTH_URL
  ? new URL(process.env.BETTER_AUTH_URL)
  : undefined

if (!DOMAIN) throw Error('Site domain undefined')

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const from = process.env.FROM_AUTH_ALIAS

if (!from) {
  throw new Error('FROM_AUTH_ALIAS environment variable is required')
}

export const auth = betterAuth({
  basePath: '/api/v1/auth',
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  account: { accountLinking: { enabled: true } },
  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async (data) => {
        const {
          user: { email, name },
          url,
        } = data

        const html = await reactToHTML(DeleteUserEmail({ url, name }))
        const text = toPlainText(html)
        await transporter.sendMail({
          from,
          to: email,
          subject: 'Delete account - Action required',
          html,
          text,
        })
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async (data) => {
      const {
        user: { email, name },
        url,
      } = data

      const html = await reactToHTML(ResetPassword({ url, name }))
      const text = toPlainText(html)
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Reset your password - Action required',
        html,
        text,
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async (data) => {
      const {
        user: { email },
        url,
      } = data

      const html = await reactToHTML(EmailVerification({ url }))
      const text = toPlainText(html)
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Verify your email address',
        html,
        text,
      })
    },
  },
  socialProviders: {
    google: {
      prompt: 'select_account',
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: async (profile) => {
        const { email, picture } = profile
        const existingUser = await prisma.user.findFirst({
          where: { email },
        })

        if (!existingUser) return

        if (picture && !existingUser?.image) {
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

            // Validate and consume the tester code
            const isValid = await validateAndConsumeReferralCode(
              referralCode,
              user.id,
            )

            // If valid, update user role to tester
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
      if (ctx.path.startsWith('/sign-up')) {
        const newSession = ctx.context.newSession
        const re = ctx.body?.re

        if (newSession?.user && re && typeof re === 'string') {
          // Validate and consume the tester code
          const isValid = await validateAndConsumeReferralCode(
            re,
            newSession.user.id,
          )

          console.log('isValid', isValid)

          // If valid, update user role to tester
          if (isValid) {
            await updateUserRole(newSession.user.id, 'tester')
          }
          // If invalid, continue with normal flow (user remains with default role)
        }
      }
    }),
  },
})
