'use client'

import { useEffect, useReducer, useRef } from 'react'
import {
  ROOM_EVENT,
  VIDEO_EVENT,
  type VideoIdArrayPayload,
  type VideoPlaybackProgressPayload,
} from '@virtality/shared/types'
import { subscribe } from '@/lib/device-event-controller'
import {
  initialImmersivePlaybackState,
  PLAY_ACK_TIMEOUT_MS,
  REATTACH_WAIT_MS,
  reduceImmersivePlayback,
} from '@/lib/immersive-video-playback-reducer'
import type { VRDevice } from '@/types/models'

export function useImmersiveVideoPlayback(
  device?: VRDevice | null,
  options?: { frozen?: boolean },
) {
  const frozen = options?.frozen === true
  const [state, dispatch] = useReducer(
    reduceImmersivePlayback,
    initialImmersivePlaybackState,
  )
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reattachTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deviceRef = useRef(device)
  deviceRef.current = device

  const clearPlayTimeout = () => {
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
      playTimeoutRef.current = null
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
      clearReattachTimeout()
    }
  }, [])

  useEffect(() => {
    const socket = device?.socket
    if (!socket) return

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
        clearReattachTimeout()
        dispatch({ type: 'memberLeft' })
      },
    })

    const unsubscribeVideo = subscribe(socket, VIDEO_EVENT, {
      PlayAck: ([videoId]: VideoIdArrayPayload) => {
        clearPlayTimeout()
        dispatch({ type: 'playAck', videoId })
      },
      PlaybackProgress: (payload: VideoPlaybackProgressPayload) => {
        clearReattachTimeout()
        dispatch({ type: 'progress', payload, now: Date.now() })
      },
      Ended: () => {
        clearPlayTimeout()
        dispatch({ type: 'ended' })
      },
    })

    const onDisconnect = () => {
      clearPlayTimeout()
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
  }, [device])

  const readyDevice = () => {
    if (!device || frozen) return null
    return device
  }

  const sendPlay = (videoId: string) => {
    const target = readyDevice()
    if (!target || state.pendingPlay != null) return
    dispatch({ type: 'playSent', videoId })
    target.events.video.Play([videoId])
    clearPlayTimeout()
    playTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'playTimeout' })
    }, PLAY_ACK_TIMEOUT_MS)
  }

  const sendPause = () => {
    const target = readyDevice()
    if (!target) return
    dispatch({ type: 'pause' })
    target.events.video.Pause()
  }

  const sendResume = () => {
    const target = readyDevice()
    if (!target) return
    dispatch({ type: 'resume' })
    target.events.video.Resume()
  }

  const sendStop = () => {
    const target = readyDevice()
    if (!target) return
    target.events.video.Stop()
  }

  const sendRecenter = () => {
    const target = readyDevice()
    if (!target) return
    dispatch({ type: 'recenter', now: Date.now() })
    target.events.video.Recenter()
  }

  const enterImmersive = () => {
    dispatch({ type: 'enterImmersive', now: Date.now() })
  }

  const dismissConfirm = () => {
    dispatch({ type: 'dismissConfirm' })
  }

  return {
    state,
    sendPlay,
    sendPause,
    sendResume,
    sendStop,
    sendRecenter,
    enterImmersive,
    dismissConfirm,
  }
}
