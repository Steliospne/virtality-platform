'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CASTING_LOAD_TIMEOUT_MS,
  isCastingLoadWindow,
  shouldShowCastingTimeoutPrompt,
  type CastingPlayerView,
} from '@/lib/patient-dashboard-casting-panel'

export function useCastingLoadTimeout(playerView: CastingPlayerView) {
  const [loadAttemptKey, setLoadAttemptKey] = useState(0)
  const [hasLoadTimedOut, setHasLoadTimedOut] = useState(false)

  useEffect(() => {
    if (!isCastingLoadWindow(playerView)) {
      setHasLoadTimedOut(false)
      setLoadAttemptKey(0)
      return
    }

    setHasLoadTimedOut(false)
    const timeoutId = setTimeout(
      () => setHasLoadTimedOut(true),
      CASTING_LOAD_TIMEOUT_MS,
    )

    return () => clearTimeout(timeoutId)
  }, [playerView, loadAttemptKey])

  const showTimeoutPrompt = shouldShowCastingTimeoutPrompt(
    playerView,
    hasLoadTimedOut,
  )

  const handleWait = useCallback(() => {
    setHasLoadTimedOut(false)
    setLoadAttemptKey((key) => key + 1)
  }, [])

  return { showTimeoutPrompt, handleWait }
}
