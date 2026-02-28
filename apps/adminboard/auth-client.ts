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
} from '@virtality/shared/types'

const baseURL = `${process.env.NODE_ENV === 'production' ? SERVER_URL : SERVER_URL_LOCAL}${API_PREFIX}/auth`

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
