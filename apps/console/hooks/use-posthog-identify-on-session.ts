'use client'

import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { authClient } from '@/auth-client'
import { identifyPostHogUser } from '@/lib/posthog-user'

const POSTHOG_READY_POLL_MS = 50
const POSTHOG_READY_TIMEOUT_MS = 5_000

/**
 * Keeps PostHog person + feature flags in sync after client-side sign-in.
 * Initial boot in instrumentation-client.ts only sees a session on full reload.
 */
export function usePostHogIdentifyOnSession(): void {
  const { data, isPending } = authClient.useSession()
  const identifiedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (isPending) return

    const user = data?.user
    if (!user) {
      identifiedKeyRef.current = null
      return
    }

    // Re-identify (and reload feature flags) whenever verification status
    // changes for the same user, not just on first sign-in.
    const key = `${user.id}:${user.emailVerified}`
    if (identifiedKeyRef.current === key) return

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | undefined
    const startedAt = Date.now()

    const identify = () => {
      if (cancelled || identifiedKeyRef.current === key) return
      if (!posthog.__loaded) return

      identifiedKeyRef.current = key
      identifyPostHogUser(posthog, user)
    }

    identify()

    if (!posthog.__loaded) {
      intervalId = setInterval(() => {
        if (Date.now() - startedAt >= POSTHOG_READY_TIMEOUT_MS) {
          clearInterval(intervalId)
          return
        }
        identify()
        if (posthog.__loaded) {
          clearInterval(intervalId)
        }
      }, POSTHOG_READY_POLL_MS)
    }

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [isPending, data?.user])
}
