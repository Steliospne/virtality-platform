'use client'

import { useEffect, useRef } from 'react'
import { getQueryClient, useORPC } from '@virtality/react-query'
import { authClient } from '@/auth-client'

const LAST_KNOWN_VERIFIED_KEY_PREFIX = 'virtality:lastKnownEmailVerified:'

/**
 * Settle window for billing state right after verification lands. The local
 * Subscription/TrialGrant rows a fresh access-code sign-up depends on can lag
 * a beat behind the redirect (Stripe webhook delivery, replica lag), so this
 * keeps re-querying rather than trusting a single post-redirect fetch.
 */
const SETTLE_POLL_INTERVALS_MS = [500, 1_000, 1_500, 2_500, 4_000, 6_000]

function readLastKnownVerified(userId: string): boolean | null {
  try {
    const raw = localStorage.getItem(LAST_KNOWN_VERIFIED_KEY_PREFIX + userId)
    return raw === null ? null : raw === 'true'
  } catch {
    return null
  }
}

function writeLastKnownVerified(userId: string, verified: boolean): void {
  try {
    localStorage.setItem(
      LAST_KNOWN_VERIFIED_KEY_PREFIX + userId,
      String(verified),
    )
  } catch {
    // localStorage unavailable (private mode, etc.) - best effort only.
  }
}

/**
 * Refetches billing/entitlement standing once a session's emailVerified
 * flips true. Handles two cases that leave billing looking stale:
 *  - a console tab already open when the user verifies elsewhere (the
 *    previous state, persisted per-user, is remembered across page loads)
 *  - the hard redirect straight back to the console after clicking the
 *    verification link landing before the backend's own billing sync
 *    (webhook / replica lag) has settled - keep polling on a backoff until
 *    the standing reports entitled or the settle window runs out, mirroring
 *    the Checkout success restore poll.
 */
export function useInvalidateBillingOnVerification(): void {
  const { data, isPending } = authClient.useSession()
  const orpc = useORPC()
  const pollingForUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (isPending) return

    const user = data?.user
    if (!user) return

    const lastKnownVerified = readLastKnownVerified(user.id)
    writeLastKnownVerified(user.id, user.emailVerified)

    const justVerified = user.emailVerified && lastKnownVerified !== true

    if (!justVerified || pollingForUserIdRef.current === user.id) return
    pollingForUserIdRef.current = user.id

    const queryClient = getQueryClient()
    const queryKey = orpc.entitlementClock.getStanding.key()
    let cancelled = false

    const restore = async () => {
      for (const delayMs of [0, ...SETTLE_POLL_INTERVALS_MS]) {
        if (cancelled) return
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
          if (cancelled) return
        }
        await queryClient.invalidateQueries({ queryKey })
        const [match] = queryClient.getQueriesData<{ entitled?: boolean }>({
          queryKey,
        })
        if (match?.[1]?.entitled) return
      }
    }

    void restore()

    return () => {
      cancelled = true
    }
  }, [isPending, data?.user, orpc])
}
