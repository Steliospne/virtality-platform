import { asAuthSession, auth } from '@virtality/auth'
import { prisma } from '@virtality/db'
import { decideConsoleSessionGate } from '@virtality/shared/utils'

export type SessionGateDecision = 'ok' | 'sign-in' | 'waitlist'

/**
 * Whether the requester may stay in console: signed in, and past the
 * waitlist gate for clinicians with no established billing path.
 */
export async function evaluateSessionGate(
  headers: Headers,
): Promise<SessionGateDecision> {
  try {
    const data = asAuthSession(await auth.api.getSession({ headers }))
    if (!data) return 'sign-in'

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
      await auth.api.signOut({ headers })
      return 'waitlist'
    }

    return 'ok'
  } catch (error) {
    console.error('Error checking session:', error)
    return 'ok'
  }
}
