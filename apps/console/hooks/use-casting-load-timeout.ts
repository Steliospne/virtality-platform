'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CASTING_LOAD_TIMEOUT_MS,
  shouldClearCastingTimeoutPrompt,
  shouldShowCastingTimeoutPrompt,
  type CastingPlayerView,
} from '@/lib/patient-dashboard-casting-panel'

export function useCastingLoadTimeout(playerView: CastingPlayerView) {
  const [loadWindowKey, setLoadWindowKey] = useState(0)
  const [loadWindowTimedOut, setLoadWindowTimedOut] = useState(false)

  useEffect(() => {
    if (shouldClearCastingTimeoutPrompt(playerView)) {
      setLoadWindowTimedOut(false)
      setLoadWindowKey(0)
      return
    }

    setLoadWindowTimedOut(false)
    const timeoutId = setTimeout(() => {
      setLoadWindowTimedOut(true)
    }, CASTING_LOAD_TIMEOUT_MS)

    return () => clearTimeout(timeoutId)
  }, [playerView, loadWindowKey])

  const showTimeoutPrompt = shouldShowCastingTimeoutPrompt(
    playerView,
    loadWindowTimedOut,
  )

  const handleWait = useCallback(() => {
    setLoadWindowTimedOut(false)
    setLoadWindowKey((key) => key + 1)
  }, [])

  return { showTimeoutPrompt, handleWait }
}
