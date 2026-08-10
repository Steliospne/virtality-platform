'use client'

import { useEffect, useState } from 'react'
import {
  canLaunchVrPrograms,
  formatCheckoutCtaLabel,
  formatRemainingTimeLabel,
  remainingMsFromClockEnd,
  resolveCheckoutCta,
} from '@virtality/shared/utils'
import { useEntitlementStanding } from '@virtality/react-query'
import { authClient } from '@/auth-client'

const TICK_MS = 30_000

/**
 * Live Entitlement Clock standing for Remaining Time, VR soft gate, and
 * Subscribe/Renew Checkout CTA visibility. Re-derives remaining time on an
 * interval from clockEnd so the sidebar counts down without refetching.
 */
export function useLiveEntitlementStanding() {
  const { data: session } = authClient.useSession()
  const query = useEntitlementStanding()
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  const remainingMs = remainingMsFromClockEnd(query.data?.clockEnd, nowMs)
  const entitled = remainingMs > 0
  const canLaunchVr = canLaunchVrPrograms({
    entitled,
    role: session?.user?.role,
  })
  const checkoutCta = resolveCheckoutCta({
    entitled,
    billingPathEstablished: query.data?.billingPathEstablished ?? false,
    hadPaidBilling: query.data?.hadPaidBilling ?? false,
  })

  return {
    ...query,
    remainingMs,
    entitled,
    canLaunchVr,
    checkoutCta,
    checkoutCtaLabel: formatCheckoutCtaLabel(checkoutCta),
    label: formatRemainingTimeLabel(remainingMs),
  }
}
