import { betterAuth } from 'better-auth'
import { createAuthMiddleware, getOAuthState } from 'better-auth/api'
import { core_auth } from './core-auth.ts'
import validateAndConsumeReferralCode from './lib/referral-code.ts'
import { updateUserRole } from './data/user.ts'

export const auth = betterAuth({
  ...core_auth,
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
      if (ctx.path.startsWith('/sign-up')) {
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
    }),
  },
})
