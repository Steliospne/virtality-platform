'use client'

import { useEffect, useState } from 'react'
import {
  isPaidDefaultPortalEligible,
  projectLiveEntitlementStanding,
} from '@virtality/shared/utils'
import { useEntitlementStanding } from '@virtality/react-query'
import { authClient } from '@/auth-client'
import { LIVE_ENTITLEMENT_STANDING_TICK_MS } from '@/lib/live-entitlement-standing-tick'

/**
 * Live Entitlement Clock standing for Remaining Time, VR soft gate, and
 * Subscribe/Renew Checkout CTA visibility. Re-derives remaining time on an
 * interval from clockEnd so the sidebar counts down without refetching.
 *
 * Checkout success entitlement restore runs only on `/billing/success`.
 */
export function useLiveEntitlementStanding() {
  const { data: session } = authClient.useSession()
  const query = useEntitlementStanding()
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(
      () => setNowMs(Date.now()),
      LIVE_ENTITLEMENT_STANDING_TICK_MS,
    )
    return () => window.clearInterval(id)
  }, [])

  const {
    remainingMs,
    entitled,
    canLaunchVr,
    checkoutCta,
    checkoutCtaLabel,
    label,
    showRemainingTime,
    plan,
    status,
    cancelAtPeriodEnd,
  } = projectLiveEntitlementStanding({
    standing: query.data,
    now: nowMs,
    role: session?.user?.role,
  })

  const subscribed = isPaidDefaultPortalEligible({ plan, entitled, status })

  return {
    ...query,
    remainingMs,
    entitled,
    canLaunchVr,
    checkoutCta,
    checkoutCtaLabel,
    label,
    showRemainingTime,
    subscribed,
    cancelAtPeriodEnd,
  }
}
