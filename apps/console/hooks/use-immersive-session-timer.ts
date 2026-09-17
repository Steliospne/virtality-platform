'use client'

import { useEffect, useState } from 'react'

/**
 * Seconds since `active` last turned on, ticking once a second; `null` while
 * inactive. Turning `active` off resets the clock for the next session.
 */
export function useImmersiveSessionTimer(active: boolean): number | null {
  const [elapsedSec, setElapsedSec] = useState<number | null>(null)

  useEffect(() => {
    if (!active) return
    const startedAt = Date.now()
    const tick = () => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => {
      window.clearInterval(id)
      setElapsedSec(null)
    }
  }, [active])

  return active ? elapsedSec : null
}
