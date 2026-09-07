import { authClient } from '@/auth-client'
import { prisma } from '@virtality/db'
import { decideConsoleSessionGate } from '@virtality/shared/utils'

export type SessionGateDecision = 'ok' | 'sign-in' | 'waitlist'

export type SessionGateResult = {
  decision: SessionGateDecision
  /** Raw `Set-Cookie` header values from a sign-out that must reach the browser. */
  setCookies: string[]
  user?: { id: string; role: string | null }
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

    const [subscription, accessGateHistoryRow] = await Promise.all([
      stripeCustomerId
        ? prisma.subscription.findFirst({
            where: { stripeCustomerId },
            select: { status: true },
          })
        : null,
      prisma.accessGrant.findFirst({
        where: { userId: data.user.id },
        select: { id: true },
      }),
    ])

    const decision = decideConsoleSessionGate({
      role,
      subscriptions: subscription ? [subscription] : [],
      accessGateEverIssued: accessGateHistoryRow != null,
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

    return {
      decision: 'ok',
      setCookies,
      user:
        typeof data.user.id === 'string'
          ? {
              id: data.user.id,
              role: typeof role === 'string' ? role : null,
            }
          : undefined,
    }
  } catch (error) {
    console.error('Error checking session:', error)
    return { decision: 'ok', setCookies }
  }
}
