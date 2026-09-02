'use client'

import { useEffect, useRef, useState } from 'react'
import { pendingHoldRemainingMs } from './pending-hold-countdown'

/** Ticking milliseconds remaining until `expiresAt`; fires `onExpired` once at 0. */
export function usePendingHoldCountdown(
  expiresAt: Date | string,
  onExpired?: () => void,
): number {
  const onExpiredRef = useRef(onExpired)
  onExpiredRef.current = onExpired
  const [remainingMs, setRemainingMs] = useState(() =>
    pendingHoldRemainingMs(expiresAt),
  )

  useEffect(() => {
    setRemainingMs(pendingHoldRemainingMs(expiresAt))
    const id = window.setInterval(() => {
      const next = pendingHoldRemainingMs(expiresAt)
      setRemainingMs(next)
      if (next <= 0) {
        window.clearInterval(id)
        onExpiredRef.current?.()
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [expiresAt])

  return remainingMs
}
