'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ROOM_EVENT,
  VIDEO_EVENT,
  type VideoLibraryStatePayload,
} from '@virtality/shared/types'
import useSocketConnection from '@/hooks/use-socket-connection'
import { subscribe } from '@/lib/device-event-controller'
import { isReplacementNoticeError } from '@/lib/socket-replacement-notice'
import type { HeadsetDidNotConfirmReason } from '@/lib/headset-did-not-confirm'
import { useHeadsetLibraryMirror } from '@/hooks/use-headset-library-mirror'
import {
  applyDownloadAck,
  applyDownloadComplete,
  applyDownloadFailed,
  applyDownloadPaused,
  applyDownloadProgress,
  applyDownloadRequested,
  normalizeLiveLibraryState,
  removeLibraryEntry,
  type LiveLibraryState,
} from '@/lib/headset-library-live'
import type { VRDevice } from '@/types/models'

export const DOWNLOAD_ACK_TIMEOUT_MS = 5_000

export function useHeadsetLibrary(
  device?: VRDevice | null,
  options?: { autoConnect?: boolean },
) {
  const autoConnect = options?.autoConnect ?? true
  const { connect, disconnect, connectionState, connectionError } =
    useSocketConnection({ device })
  const [roomComplete, setRoomComplete] = useState(false)
  const [libraryState, setLibraryState] = useState<LiveLibraryState | null>(
    null,
  )
  const [replaced, setReplaced] = useState(false)
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false)
  const [confirmReason, setConfirmReason] =
    useState<HeadsetDidNotConfirmReason | null>(null)
  const pendingDownloadRef = useRef<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deviceRef = useRef(device)
  deviceRef.current = device
  const libraryStateRef = useRef(libraryState)
  libraryStateRef.current = libraryState
  const mirror = useHeadsetLibraryMirror(device?.data.deviceId)

  const clearPendingDownload = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    pendingDownloadRef.current = null
  }, [])

  useEffect(() => {
    if (
      connectionState === 'failed' &&
      isReplacementNoticeError(connectionError)
    ) {
      setReplaced(true)
      setReplacementDialogOpen(true)
      setRoomComplete(false)
      clearPendingDownload()
    }
  }, [clearPendingDownload, connectionError, connectionState])

  useEffect(() => {
    if (replaced) return
    setRoomComplete(false)
    setLibraryState(null)
    clearPendingDownload()
  }, [clearPendingDownload, device?.data.id, replaced])

  useEffect(() => {
    if (!autoConnect || !device?.data.deviceId || replaced) return

    device.mutations.setDeviceRoomCode(device.data.deviceId)
    void connect()

    return () => {
      disconnect()
    }
    // Connect/disconnect are not stable; join follows the selected headset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, device, replaced])

  useEffect(() => {
    const socket = device?.socket
    if (!socket) return

    const markIncomplete = () => {
      if (pendingDownloadRef.current != null) {
        clearPendingDownload()
        setConfirmReason('disconnected')
      }
      setRoomComplete(false)
    }

    const unsubscribeRoom = subscribe(socket, ROOM_EVENT, {
      RoomComplete: () => {
        setRoomComplete(true)
        deviceRef.current?.events.video.LibraryStateRequest()
      },
      MemberLeft: markIncomplete,
    })

    const unsubscribeVideo = subscribe(socket, VIDEO_EVENT, {
      LibraryState: (payload: VideoLibraryStatePayload) => {
        const next = normalizeLiveLibraryState(payload)
        setLibraryState(next)
        setRoomComplete(true)
        mirror.onLibraryState(next)
      },
      DownloadAck: (videoId: string) => {
        if (pendingDownloadRef.current === videoId) {
          clearPendingDownload()
        }
        setLibraryState((current) => applyDownloadAck(current, videoId))
        mirror.onAck(videoId)
      },
      DownloadProgress: (payload) => {
        setLibraryState((current) => applyDownloadProgress(current, payload))
        mirror.onProgress(payload)
      },
      DownloadComplete: (videoId: string) => {
        setLibraryState((current) => applyDownloadComplete(current, videoId))
        mirror.onComplete(videoId)
        // The complete event has no version; ask for the state that does.
        deviceRef.current?.events.video.LibraryStateRequest()
      },
      DownloadFailed: (payload) => {
        setLibraryState((current) => applyDownloadFailed(current, payload))
        mirror.onFailed(payload)
      },
      DownloadPaused: (payload) => {
        setLibraryState((current) => applyDownloadPaused(current, payload))
        mirror.onPaused(payload)
      },
    })

    socket.on('disconnect', markIncomplete)

    if (socket.connected) {
      deviceRef.current?.events.video.LibraryStateRequest()
    }

    return () => {
      unsubscribeRoom()
      unsubscribeVideo()
      socket.off('disconnect', markIncomplete)
    }
  }, [mirror, clearPendingDownload, device])

  const readyDevice = useCallback((): VRDevice | null => {
    if (!device || !roomComplete || replaced) return null
    return device
  }, [device, replaced, roomComplete])

  const sendDownloadStart = useCallback(
    (videoId: string) => {
      const target = readyDevice()
      if (!target || pendingDownloadRef.current != null) return

      pendingDownloadRef.current = videoId
      target.events.video.DownloadStart(videoId)
      setLibraryState((current) => applyDownloadRequested(current, videoId))
      mirror.onRequested(videoId)
      timeoutRef.current = setTimeout(() => {
        if (pendingDownloadRef.current === videoId) {
          clearPendingDownload()
          setConfirmReason('didnt-respond')
        }
      }, DOWNLOAD_ACK_TIMEOUT_MS)
    },
    [clearPendingDownload, mirror, readyDevice],
  )

  const sendDownloadPause = useCallback(
    (videoId: string) => {
      readyDevice()?.events.video.DownloadPause({ videoId })
    },
    [readyDevice],
  )

  const sendDownloadCancel = useCallback(
    (videoId: string) => {
      const target = readyDevice()
      if (!target) return
      target.events.video.DownloadCancel(videoId)
      // A `requested` row is console intent; withdraw it without waiting for
      // a headset that may never have seen the request.
      const entry = libraryStateRef.current?.videos.find(
        (video) => video.videoId === videoId,
      )
      if (
        pendingDownloadRef.current === videoId ||
        entry?.status === 'requested'
      ) {
        if (pendingDownloadRef.current === videoId) clearPendingDownload()
        setLibraryState((current) => removeLibraryEntry(current, videoId))
        mirror.onRemoved(videoId)
      }
    },
    [clearPendingDownload, mirror, readyDevice],
  )

  const sendDelete = useCallback(
    (videoId: string) => {
      readyDevice()?.events.video.Delete(videoId)
    },
    [readyDevice],
  )

  return {
    roomComplete,
    libraryState,
    replaced,
    replacementDialogOpen,
    confirmReason,
    dismissConfirm: () => setConfirmReason(null),
    dismissReplacementDialog: () => setReplacementDialogOpen(false),
    sendDownloadStart,
    sendDownloadPause,
    sendDownloadCancel,
    sendDelete,
  }
}
