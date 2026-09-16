'use client'

import { useCallback, useMemo, useRef } from 'react'
import type {
  VideoDownloadFailedPayload,
  VideoDownloadPausedPayload,
  VideoDownloadProgressPayload,
} from '@virtality/shared/types'
import {
  useWriteHeadsetLibrary,
  type HeadsetLibraryWriteError,
} from '@virtality/react-query'
import ErrorToasty from '@/components/ui/ErrorToasty'
import { mirrorWriteErrorMessage } from '@/lib/headset-library-mirror-errors'
import {
  asLibraryVideos,
  clampBytesDownloaded,
  type LiveLibraryState,
} from '@/lib/headset-library-live'

/** Progress ticks once a second; the mirror only needs a coarse picture. */
export const PROGRESS_WRITE_INTERVAL_MS = 10_000

/**
 * Writes the Library Mirror from what the console sees on the socket.
 * Fire-and-forget: the live view never waits on the API, and a
 * failed write is repaired by the next full `videoLibraryState`. Every
 * rejected write is logged; only a rejected Download Request is toasted.
 */
export function useHeadsetLibraryMirror(deviceId: string | null | undefined) {
  const onError = useCallback((error: HeadsetLibraryWriteError) => {
    const message = mirrorWriteErrorMessage(error)
    if (message) ErrorToasty(message)
  }, [])
  const { reportLibraryState, requestDownload, applyEvent, remove } =
    useWriteHeadsetLibrary({ onError })
  // `mutate` is referentially stable, so callbacks only change with the headset.
  const writer = useMemo(
    () => ({
      reportLibraryState: reportLibraryState.mutate,
      requestDownload: requestDownload.mutate,
      applyEvent: applyEvent.mutate,
      remove: remove.mutate,
    }),
    [
      reportLibraryState.mutate,
      requestDownload.mutate,
      applyEvent.mutate,
      remove.mutate,
    ],
  )
  const lastProgressWriteRef = useRef(new Map<string, number>())

  const withHeadset = useCallback(
    (fn: (headsetId: string, w: typeof writer) => void) => {
      if (!deviceId) return
      fn(deviceId, writer)
    },
    [deviceId, writer],
  )

  const onLibraryState = useCallback(
    (state: LiveLibraryState) =>
      withHeadset((headsetId, w) =>
        w.reportLibraryState({
          deviceId: headsetId,
          freeBytes: state.freeBytes,
          videos: asLibraryVideos(state.videos).flatMap((entry) =>
            entry.status === 'requested'
              ? []
              : [
                  {
                    videoId: entry.videoId,
                    status: entry.status,
                    bytesDownloaded: entry.bytesDownloaded,
                    sizeBytes: entry.sizeBytes,
                    reason: entry.reason,
                  },
                ],
          ),
        }),
      ),
    [withHeadset],
  )

  const onRequested = useCallback(
    (videoId: string) =>
      withHeadset((headsetId, w) =>
        w.requestDownload({ deviceId: headsetId, videoId }),
      ),
    [withHeadset],
  )

  const onAck = useCallback(
    (videoId: string) =>
      withHeadset((headsetId, w) =>
        w.applyEvent({
          deviceId: headsetId,
          videoId,
          status: 'downloading',
          bytesDownloaded: 0,
        }),
      ),
    [withHeadset],
  )

  const onProgress = useCallback(
    (payload: VideoDownloadProgressPayload) => {
      const now = Date.now()
      const last = lastProgressWriteRef.current.get(payload.videoId) ?? 0
      if (now - last < PROGRESS_WRITE_INTERVAL_MS) return
      lastProgressWriteRef.current.set(payload.videoId, now)
      withHeadset((headsetId, w) =>
        w.applyEvent({
          deviceId: headsetId,
          videoId: payload.videoId,
          status: 'downloading',
          bytesDownloaded: clampBytesDownloaded(
            payload.bytesDownloaded,
            payload.sizeBytes,
          ),
          sizeBytes: payload.sizeBytes,
        }),
      )
    },
    [withHeadset],
  )

  const onComplete = useCallback(
    (videoId: string) =>
      withHeadset((headsetId, w) =>
        w.applyEvent({
          deviceId: headsetId,
          videoId,
          status: 'ready',
        }),
      ),
    [withHeadset],
  )

  const onFailed = useCallback(
    (payload: VideoDownloadFailedPayload) =>
      withHeadset((headsetId, w) =>
        w.applyEvent({
          deviceId: headsetId,
          videoId: payload.videoId,
          status: 'failed',
          reason: payload.reason,
        }),
      ),
    [withHeadset],
  )

  const onPaused = useCallback(
    (payload: VideoDownloadPausedPayload) =>
      withHeadset((headsetId, w) =>
        w.applyEvent({
          deviceId: headsetId,
          videoId: payload.videoId,
          status: 'paused',
          bytesDownloaded: payload.bytesDownloaded,
        }),
      ),
    [withHeadset],
  )

  const onRemoved = useCallback(
    (videoId: string) =>
      withHeadset((headsetId, w) => w.remove({ deviceId: headsetId, videoId })),
    [withHeadset],
  )

  return useMemo(
    () => ({
      onLibraryState,
      onRequested,
      onAck,
      onProgress,
      onComplete,
      onFailed,
      onPaused,
      onRemoved,
    }),
    [
      onLibraryState,
      onRequested,
      onAck,
      onProgress,
      onComplete,
      onFailed,
      onPaused,
      onRemoved,
    ],
  )
}
