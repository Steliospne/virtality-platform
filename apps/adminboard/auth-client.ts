import {
  organizationClient,
  adminClient,
  phoneNumberClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { stripeClient } from '@better-auth/stripe/client'
import { API_PREFIX, getServerUrl } from '@virtality/shared/types'

const base = getServerUrl()

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
