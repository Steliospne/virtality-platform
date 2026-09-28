'use client'

import { useEffect, useState } from 'react'
import {
  nextTimeLimitStartSec,
  timeLimitElapsedSec,
} from '@/lib/immersive-video-auto-stop'

type TimeLimit = { minutes: number | null; startSec: number | null }

/**
 * Holds the **Session Time Limit** and how long it has run. Picked before
 * play it counts from the play command; picked mid-session it counts from
 * that moment. The limit itself outlives the session; its start does not.
 */
export function useImmersiveTimeLimit(sessionElapsedSec: number | null) {
  const [limit, setLimit] = useState<TimeLimit>({
    minutes: null,
    startSec: null,
  })
  const sessionRunning = sessionElapsedSec != null

  useEffect(() => {
    if (sessionRunning) return
    setLimit((prev) =>
      prev.startSec == null ? prev : { ...prev, startSec: null },
    )
  }, [sessionRunning])

  const setStopAfterMin = (minutes: number | null) => {
    setLimit((prev) => ({
      minutes,
      startSec: nextTimeLimitStartSec({
        prevMinutes: prev.minutes,
        nextMinutes: minutes,
        sessionElapsedSec,
        startSec: prev.startSec,
      }),
    }))
  }

  return {
    stopAfterMin: limit.minutes,
    setStopAfterMin,
    timeLimitElapsedSec: timeLimitElapsedSec({
      sessionElapsedSec,
      stopAfterMin: limit.minutes,
      startSec: limit.startSec,
    }),
  }
}
