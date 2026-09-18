'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ROOM_EVENT,
  VIDEO_EVENT,
  type VideoLibraryStatePayload,
} from '@virtality/shared/types'
import { useDeviceVideosForUser } from '@virtality/react-query'
import useSocketConnection from '@/hooks/use-socket-connection'
import { subscribe } from '@/lib/device-event-controller'
import { isReplacementNoticeError } from '@/lib/socket-replacement-notice'
import type { HeadsetDidNotConfirmReason } from '@/lib/headset-did-not-confirm'
import { useHeadsetLibraryMirror } from '@/hooks/use-headset-library-mirror'
import ErrorToasty from '@/components/ui/ErrorToasty'
import SuccessToasty from '@/components/ui/SuccessToasty'
import { videoFailureMessage } from '@/lib/video-failure-message'
import {
  applyDownloadAck,
  applyDownloadComplete,
  applyDownloadFailed,
  applyDownloadPaused,
  applyDownloadProgress,
  applyDownloadRequested,
  normalizeLiveLibraryState,
  removeLibraryEntry,
  requestedVideoIds,
  selectDownloadsToResume,
  type LiveLibraryState,
} from '@/lib/headset-library-live'
import type { VRDevice } from '@/types/models'

export const DOWNLOAD_ACK_TIMEOUT_MS = 5_000

/**
 * Live Headset Library for one headset. `enabled: false` (the patient
 * dashboard outside Immersive Video mode) keeps the hook mounted but silent:
 * no socket subscription, no `videoLibraryStateRequest`, no mirror writes.
 */
export function useHeadsetLibrary(
  device?: VRDevice | null,
  options?: { autoConnect?: boolean; enabled?: boolean },
) {
  const autoConnect = options?.autoConnect ?? true
  const enabled = options?.enabled ?? true
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
  /** Download Requests sent on this connection; resumed at most once each. */
  const sentDownloadsRef = useRef(new Set<string>())
  const deviceRef = useRef(device)
  deviceRef.current = device
  const libraryStateRef = useRef(libraryState)
  libraryStateRef.current = libraryState
  const mirror = useHeadsetLibraryMirror(device?.data.deviceId)
  const mirrorQuery = useDeviceVideosForUser()
  const mirrorRequested = useMemo(
    () => requestedVideoIds(mirrorQuery.data, device?.data.deviceId),
    [mirrorQuery.data, device?.data.deviceId],
  )

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
    sentDownloadsRef.current.clear()
  }, [clearPendingDownload, device?.data.id, replaced])

  /**
   * Emits `videoDownloadStart` and waits for the ack. A physio's click that
   * goes unanswered is reported; a resumed request stays quiet.
   */
  const startDownload = useCallback(
    (videoId: string, options: { resumed: boolean }) => {
      const target = deviceRef.current
      if (!target || pendingDownloadRef.current != null) return

      pendingDownloadRef.current = videoId
      sentDownloadsRef.current.add(videoId)
      target.events.video.DownloadStart(videoId)
      setLibraryState((current) => applyDownloadRequested(current, videoId))
      if (!options.resumed) mirror.onRequested(videoId)
      timeoutRef.current = setTimeout(() => {
        if (pendingDownloadRef.current !== videoId) return
        clearPendingDownload()
        if (!options.resumed) setConfirmReason('didnt-respond')
      }, DOWNLOAD_ACK_TIMEOUT_MS)
    },
    [clearPendingDownload, mirror],
  )

  // A `requested` mirror row the headset does not report is a request it
  // never received; send it again once the headset is in the room. One at a
  // time: the next goes out when the current one is acknowledged.
  useEffect(() => {
    if (!roomComplete || replaced || !libraryState) return
    if (pendingDownloadRef.current != null) return
    const [next] = selectDownloadsToResume({
      requested: mirrorRequested,
      live: libraryState,
      alreadySent: sentDownloadsRef.current,
    })
    if (next) startDownload(next, { resumed: true })
  }, [libraryState, mirrorRequested, replaced, roomComplete, startDownload])

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
    if (!socket || !enabled) return

    const markIncomplete = () => {
      if (pendingDownloadRef.current != null) {
        clearPendingDownload()
        setConfirmReason('disconnected')
      }
      // The headset left; whatever it did not ack may be resent on return.
      sentDownloadsRef.current.clear()
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
        // Confirm the file is listed rather than trusting the event alone.
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
      // The headset confirmed the file (or `.part`) is gone: no row.
      DownloadCancelAck: (videoId: string) => {
        setLibraryState((current) => removeLibraryEntry(current, videoId))
        mirror.onRemoved(videoId)
      },
      DeleteAck: (videoId: string) => {
        setLibraryState((current) => removeLibraryEntry(current, videoId))
        mirror.onRemoved(videoId)
      },
      // The ack already dropped the row; these only tell the physio the outcome.
      DownloadCancelComplete: (videoId: string) => {
        SuccessToasty(`Download cancelled (${videoId})`)
      },
      DownloadCancelFailed: (payload) => {
        ErrorToasty(videoFailureMessage('Cancel failed', payload))
      },
      DeleteComplete: (videoId: string) => {
        SuccessToasty(`Video deleted (${videoId})`)
      },
      DeleteFailed: (payload) => {
        ErrorToasty(videoFailureMessage('Delete failed', payload))
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
  }, [mirror, clearPendingDownload, device, enabled])

  const readyDevice = useCallback((): VRDevice | null => {
    if (!device || !enabled || !roomComplete || replaced) return null
    return device
  }, [device, enabled, replaced, roomComplete])

  const sendDownloadStart = useCallback(
    (videoId: string) => {
      if (!readyDevice()) return
      startDownload(videoId, { resumed: false })
    },
    [readyDevice, startDownload],
  )

  const sendDownloadPause = useCallback(
    (videoId: string) => {
      readyDevice()?.events.video.DownloadPause(videoId)
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
