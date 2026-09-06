'use client'

import { useEffect, useRef } from 'react'
import { getQueryClient, useORPC } from '@virtality/react-query'
import { authClient } from '@/auth-client'

/**
 * The entitlement clock and renew-prompt queries key off the session cookie
 * server-side rather than a client-supplied user id, so their cached data
 * doesn't naturally vary by user. Without this, signing out and back in (or
 * switching accounts) in the same tab serves the previous session's cached
 * standing/prompts until the query's staleTime elapses.
 */
export function useInvalidateEntitlementsOnLogin(): void {
  const { data, isPending } = authClient.useSession()
  const orpc = useORPC()
  const lastUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (isPending) return

    const userId = data?.user?.id ?? null
    if (lastUserIdRef.current === userId) return
    lastUserIdRef.current = userId

    if (!userId) return

    const queryClient = getQueryClient()
    void queryClient.invalidateQueries({
      queryKey: orpc.entitlementClock.getStanding.key(),
    })
    void queryClient.invalidateQueries({
      queryKey: orpc.renewPrompt.listInApp.key(),
    })
  }, [isPending, data?.user?.id, orpc])
}
