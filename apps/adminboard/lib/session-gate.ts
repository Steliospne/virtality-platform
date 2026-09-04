import { authClient } from '@/auth-client'

export type SessionGateDecision = 'ok' | 'sign-in' | 'no-access'

/**
 * Whether the requester may stay in adminboard: signed in, and an admin.
 *
 * Calls the server's auth API over HTTP rather than constructing an
 * in-process `auth` instance, so adminboard needs no Stripe/OAuth secrets
 * of its own — only the server does.
 */
export async function evaluateSessionGate(
  headers: Headers,
): Promise<SessionGateDecision> {
  const { data } = await authClient.getSession({ fetchOptions: { headers } })

  if (!data) return 'sign-in'
  if (data.user.role !== 'admin') return 'no-access'

  return 'ok'
}
