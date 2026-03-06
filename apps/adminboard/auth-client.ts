import {
  organizationClient,
  adminClient,
  phoneNumberClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { stripeClient } from '@better-auth/stripe/client'
import {
  API_PREFIX,
  SERVER_URL,
  SERVER_URL_LOCAL,
  SERVER_URL_STAGING,
} from '@virtality/shared/types'

const env = process.env.NEXT_PUBLIC_ENV || 'development'

const base =
  env === 'production'
    ? SERVER_URL
    : env === 'preview'
      ? SERVER_URL_STAGING
      : SERVER_URL_LOCAL

const baseURL = base + API_PREFIX + '/auth'

console.log('auth client baseURL: ', baseURL)

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    adminClient(),
    organizationClient(),
    phoneNumberClient(),
    stripeClient({
      subscription: true,
    }),
  ],
})

export type User = typeof authClient.$Infer.Session.user

export type Session = typeof authClient.$Infer.Session.session
