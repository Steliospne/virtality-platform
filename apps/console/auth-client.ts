import {
  organizationClient,
  adminClient,
  phoneNumberClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { stripeClient } from '@better-auth/stripe/client'
import { ac, roles } from './permissions'
import { API_PREFIX } from './data/static/const'

const baseURL = `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:8080'}${API_PREFIX}/auth`

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
