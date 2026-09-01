import { authClient } from '@/auth-client'
import { prisma } from '@virtality/db'
import { decideConsoleSessionGate } from '@virtality/shared/utils'

export type SessionGateDecision = 'ok' | 'sign-in' | 'waitlist'

export type SessionGateResult = {
  decision: SessionGateDecision
  /** Raw `Set-Cookie` header values from a sign-out that must reach the browser. */
  setCookies: string[]
}

/**
 * Whether the requester may stay in console: signed in, and past the
 * waitlist gate for clinicians with no established billing path.
 *
 * Calls the server's auth API over HTTP rather than constructing an
 * in-process `auth` instance, so console needs no OAuth provider secrets
 * of its own — only the server does.
 */
export async function evaluateSessionGate(
  headers: Headers,
): Promise<SessionGateResult> {
  const setCookies: string[] = []

  try {
    const { data } = await authClient.getSession({ fetchOptions: { headers } })
    if (!data) return { decision: 'sign-in', setCookies }

    const {
      user: { stripeCustomerId, role },
    } = data

    // Existence only: Billing Path Established is any synced row, any status.
    const subscription = stripeCustomerId
      ? await prisma.subscription.findFirst({
          where: { stripeCustomerId },
          select: { status: true },
        })
      : null

    const decision = decideConsoleSessionGate({
      role,
      subscriptions: subscription ? [subscription] : [],
    })

    if (decision === 'waitlist') {
      // Never-established billing path only. Expiry with a synced Subscription
      // stays in console (no sign-out solely for clock end).
      await authClient.signOut({
        fetchOptions: {
          headers,
          onResponse: (context) => {
            setCookies.push(...context.response.headers.getSetCookie())
          },
        },
      })
      return { decision: 'waitlist', setCookies }
    }

    return { decision: 'ok', setCookies }
  } catch (error) {
    console.error('Error checking session:', error)
    return { decision: 'ok', setCookies }
  }
}
