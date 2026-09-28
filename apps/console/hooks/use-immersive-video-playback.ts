'use client'

import { useEffect, useReducer, useRef } from 'react'
import {
  ROOM_EVENT,
  VIDEO_EVENT,
  type VideoPlaybackProgressPayload,
} from '@virtality/shared/types'
import { subscribe } from '@/lib/device-event-controller'
import {
  initialImmersivePlaybackState,
  PLAY_ACK_TIMEOUT_MS,
  REATTACH_WAIT_MS,
  reduceImmersivePlayback,
  STOP_ACK_TIMEOUT_MS,
} from '@/lib/immersive-video-playback-reducer'
import type { VRDevice } from '@/types/models'

/**
 * Playback transport for one headset. `enabled: false` keeps it silent; the
 * mode selector is locked while a video is Starting/Playing/Paused, so the
 * dashboard can only leave Immersive Video mode from Idle.
 */
export function useImmersiveVideoPlayback(
  device?: VRDevice | null,
  options?: { frozen?: boolean; enabled?: boolean },
) {
  const frozen = options?.frozen === true
  const enabled = options?.enabled ?? true
  const [state, dispatch] = useReducer(
    reduceImmersivePlayback,
    initialImmersivePlaybackState,
  )
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reattachTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deviceRef = useRef(device)
  deviceRef.current = device

  const clearPlayTimeout = () => {
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
      playTimeoutRef.current = null
    }
  }

  const clearStopTimeout = () => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current)
      stopTimeoutRef.current = null
    }
  }

  const clearReattachTimeout = () => {
    if (reattachTimeoutRef.current) {
      clearTimeout(reattachTimeoutRef.current)
      reattachTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearPlayTimeout()
      clearStopTimeout()
      clearReattachTimeout()
    }
  }, [])

  useEffect(() => {
    const socket = device?.socket
    if (!socket || !enabled) return

    const startReattachWait = () => {
      clearReattachTimeout()
      dispatch({ type: 'roomComplete' })
      reattachTimeoutRef.current = setTimeout(() => {
        dispatch({ type: 'reattachTimeout' })
      }, REATTACH_WAIT_MS)
    }

    const unsubscribeRoom = subscribe(socket, ROOM_EVENT, {
      RoomComplete: startReattachWait,
      MemberLeft: () => {
        clearPlayTimeout()
        clearStopTimeout()
        clearReattachTimeout()
        dispatch({ type: 'memberLeft' })
      },
    })

    const unsubscribeVideo = subscribe(socket, VIDEO_EVENT, {
      PlayAck: (videoId: string) => {
        clearPlayTimeout()
        dispatch({ type: 'playAck', videoId })
      },
      PlaybackProgress: (payload: VideoPlaybackProgressPayload) => {
        clearReattachTimeout()
        dispatch({ type: 'progress', payload, now: Date.now() })
      },
      Ended: () => {
        clearPlayTimeout()
        clearStopTimeout()
        dispatch({ type: 'ended' })
      },
      StopAck: (videoId: string) => {
        clearPlayTimeout()
        clearStopTimeout()
        dispatch({ type: 'stopAck', videoId })
      },
    })

    const onDisconnect = () => {
      clearPlayTimeout()
      clearStopTimeout()
      clearReattachTimeout()
      dispatch({ type: 'memberLeft' })
    }

    socket.on('disconnect', onDisconnect)

    if (socket.connected) {
      startReattachWait()
    }

    return () => {
      unsubscribeRoom()
      unsubscribeVideo()
      socket.off('disconnect', onDisconnect)
    }
  }, [device, enabled])

  const readyDevice = () => {
    if (!device || frozen || !enabled) return null
    return device
  }

  const sendPlay = (videoId: string) => {
    const target = readyDevice()
    if (!target || state.pendingPlay != null) return
    dispatch({ type: 'playSent', videoId })
    target.events.video.Play(videoId)
    clearPlayTimeout()
    playTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'playTimeout' })
    }, PLAY_ACK_TIMEOUT_MS)
  }

  /** One `videoPause` toggles pause and resume, like the program's pause. */
  const sendPause = () => {
    const target = readyDevice()
    if (!target) return
    dispatch({ type: 'pauseToggle' })
    target.events.video.Pause()
  }

  /** The video stays Playing/Paused until `videoStopAck` or the timeout. */
  const sendStop = () => {
    const target = readyDevice()
    if (!target || state.videoId == null || state.pendingStop != null) return
    dispatch({ type: 'stopSent' })
    target.events.video.Stop(state.videoId)
    clearStopTimeout()
    stopTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'stopTimeout' })
    }, STOP_ACK_TIMEOUT_MS)
  }

  /** Recentre the view via the program's `resetPosition`; the dashboard toasts the ack. */
  const sendRecenter = () => {
    const target = readyDevice()
    if (!target) return
    target.events.program.ResetPosition()
  }

  const dismissConfirm = () => {
    dispatch({ type: 'dismissConfirm' })
  }

  return {
    state,
    sendPlay,
    sendPause,
    sendStop,
    sendRecenter,
    dismissConfirm,
  }
}
