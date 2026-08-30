'use client'

import { useEffect, useRef, useState } from 'react'
import { useEntitlementStanding } from '@virtality/react-query'
import { projectLiveEntitlementStanding } from '@virtality/shared/utils'
import { authClient } from '@/auth-client'
import { LIVE_ENTITLEMENT_STANDING_TICK_MS } from '@/lib/live-entitlement-standing-tick'
import {
  CHECKOUT_ENTITLEMENT_RESTORE_MAX_MS,
  CHECKOUT_ENTITLEMENT_RESTORE_POLL_MS,
  shouldPollCheckoutEntitlementRestore,
} from '@/lib/subscription-checkout'

export type CheckoutEntitlementRestoreState = {
  entitled: boolean
  isStandingPending: boolean
  isActivating: boolean
  timedOut: boolean
}

/**
 * Polls Live Entitlement Standing after Checkout success until webhook sync
 * restores access. Only the Checkout Success Page should invoke this helper.
 */
export function useCheckoutEntitlementRestore(): CheckoutEntitlementRestoreState {
  const { data: session } = authClient.useSession()
  const query = useEntitlementStanding()
  const restoreStartedAtMs = useRef(Date.now())
  const [timedOut, setTimedOut] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(
      () => setNowMs(Date.now()),
      LIVE_ENTITLEMENT_STANDING_TICK_MS,
    )
    return () => window.clearInterval(id)
  }, [])

  const { entitled } = projectLiveEntitlementStanding({
    standing: query.data,
    now: nowMs,
    role: session?.user?.role,
  })

  useEffect(() => {
    if (query.isPending) return
    if (entitled) return

    const startedAtMs = restoreStartedAtMs.current
    const tick = () => {
      const keepPolling = shouldPollCheckoutEntitlementRestore({
        intent: 'success',
        entitled: false,
        startedAtMs,
        nowMs: Date.now(),
      })
      if (!keepPolling) {
        setTimedOut(true)
        return
      }
      void query.refetch()
    }

    const pollId = window.setInterval(
      tick,
      CHECKOUT_ENTITLEMENT_RESTORE_POLL_MS,
    )
    const stopId = window.setTimeout(() => {
      window.clearInterval(pollId)
      setTimedOut(true)
    }, CHECKOUT_ENTITLEMENT_RESTORE_MAX_MS)

    return () => {
      window.clearInterval(pollId)
      window.clearTimeout(stopId)
    }
  }, [entitled, query.isPending, query.refetch])

  return {
    entitled,
    isStandingPending: query.isPending,
    isActivating: !query.isPending && !entitled && !timedOut,
    timedOut: timedOut && !entitled,
  }
}
