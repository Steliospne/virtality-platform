'use client'

import { useEffect, useEffectEvent, useRef } from 'react'
import { shouldAutoStopImmersive } from '@/lib/immersive-video-auto-stop'
import type { ImmersivePlaybackStatus } from '@/lib/immersive-video-playback-reducer'

/**
 * Sends `videoStop` once per session when the **Session Time Limit** is
 * reached. If the headset ignores it, the physio's Stop button still works;
 * the hook does not resend. A new session (clock back to `null`) re-arms it.
 */
export function useImmersiveAutoStop(input: {
  elapsedSec: number | null
  stopAfterMin: number | null
  status: ImmersivePlaybackStatus
  commandsEnabled: boolean
  sendStop: () => void
}) {
  const { elapsedSec, stopAfterMin, status, commandsEnabled } = input
  const firedRef = useRef(false)
  const sendStop = useEffectEvent(input.sendStop)

  const due = shouldAutoStopImmersive({
    elapsedSec,
    stopAfterMin,
    status,
    commandsEnabled,
  })
  const sessionRunning = elapsedSec != null

  useEffect(() => {
    if (!sessionRunning) firedRef.current = false
  }, [sessionRunning])

  useEffect(() => {
    if (!due || firedRef.current) return
    firedRef.current = true
    sendStop()
  }, [due])
}
