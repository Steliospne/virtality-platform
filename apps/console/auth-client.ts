import {
  organizationClient,
  adminClient,
  phoneNumberClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { stripeClient } from '@better-auth/stripe/client'
import { ac, roles } from './permissions'
import { API_PREFIX } from './data/static/const'
import {
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

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    adminClient({ ac, roles }),
    organizationClient(),
    phoneNumberClient(),
    stripeClient({
      subscription: true,
    }),
  ],
})

export type User = typeof authClient.$Infer.Session.user & {
  stripeCustomerId: string | null
}
export type Session = typeof authClient.$Infer.Session.session
