import { betterAuth } from 'better-auth'
import { core_auth } from './core-auth.ts'
import {
  EmailData,
  sendDeleteAccountVerification,
  sendResetPassword,
  sendVerificationEmail,
} from '@virtality/nodemailer'

export const auth = betterAuth({
  ...core_auth,
  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword,
  },
  emailVerification: {
    sendVerificationEmail,
  },
})

export type { AuthContext } from './lib/auth-context.ts'
