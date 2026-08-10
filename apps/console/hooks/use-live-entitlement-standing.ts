'use client'

import { useEffect, useRef, useState } from 'react'
import {
  canLaunchVrPrograms,
  formatCheckoutCtaLabel,
  formatRemainingTimeLabel,
  remainingMsFromClockEnd,
  resolveCheckoutCta,
} from '@virtality/shared/utils'
import { useEntitlementStanding } from '@virtality/react-query'
import { authClient } from '@/auth-client'
import {
  CHECKOUT_ENTITLEMENT_RESTORE_MAX_MS,
  CHECKOUT_ENTITLEMENT_RESTORE_POLL_MS,
  checkoutEntitlementRestoreRefetchInterval,
  readCheckoutReturnIntent,
  stripCheckoutReturnIntent,
  type CheckoutReturnIntent,
} from '@/lib/subscription-checkout'

const TICK_MS = 30_000

function readIntentFromWindow(): CheckoutReturnIntent | null {
  if (typeof window === 'undefined') return null
  return readCheckoutReturnIntent(window.location.search)
}

function replaceConsoleUrlWithoutCheckoutReturn() {
  if (typeof window === 'undefined') return
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const next = stripCheckoutReturnIntent(current)
  if (next !== current) {
    window.history.replaceState(window.history.state, '', next)
  }
}

/**
 * Live Entitlement Clock standing for Remaining Time, VR soft gate, and
 * Subscribe/Renew Checkout CTA visibility. Re-derives remaining time on an
 * interval from clockEnd so the sidebar counts down without refetching.
 *
 * After Checkout success return, polls standing until webhook/success sync
 * restores a live clock (never dual-writes entitlement). Cancel/abandon does
 * not poll; soft-expired CTA remains.
 */
export function useLiveEntitlementStanding() {
  const { data: session } = authClient.useSession()
  const query = useEntitlementStanding()
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [checkoutReturnIntent, setCheckoutReturnIntent] =
    useState<CheckoutReturnIntent | null>(null)
  const restoreStartedAtMs = useRef<number | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const intent = readIntentFromWindow()
    setCheckoutReturnIntent(intent)
    if (intent === 'success') {
      restoreStartedAtMs.current = Date.now()
    }
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

  useEffect(() => {
    if (checkoutReturnIntent === 'cancel') {
      replaceConsoleUrlWithoutCheckoutReturn()
      setCheckoutReturnIntent(null)
      return
    }

    if (checkoutReturnIntent !== 'success') return
    if (query.isPending) return

    if (entitled) {
      replaceConsoleUrlWithoutCheckoutReturn()
      setCheckoutReturnIntent(null)
      return
    }

    const startedAtMs = restoreStartedAtMs.current ?? Date.now()
    restoreStartedAtMs.current = startedAtMs

    const tick = () => {
      const interval = checkoutEntitlementRestoreRefetchInterval({
        intent: 'success',
        entitled: false,
        startedAtMs,
        nowMs: Date.now(),
      })
      if (interval === false) {
        replaceConsoleUrlWithoutCheckoutReturn()
        setCheckoutReturnIntent(null)
        return
      }
      void query.refetch()
    }

    const id = window.setInterval(tick, CHECKOUT_ENTITLEMENT_RESTORE_POLL_MS)
    const stopId = window.setTimeout(() => {
      window.clearInterval(id)
      replaceConsoleUrlWithoutCheckoutReturn()
      setCheckoutReturnIntent(null)
    }, CHECKOUT_ENTITLEMENT_RESTORE_MAX_MS)

    return () => {
      window.clearInterval(id)
      window.clearTimeout(stopId)
    }
  }, [checkoutReturnIntent, entitled, query.isPending, query.refetch])

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
