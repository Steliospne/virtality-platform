import type {
  VideoDownloadFailedPayload,
  VideoDownloadPausedPayload,
  VideoDownloadProgressPayload,
  VideoLibraryEntry,
  VideoLibraryStatePayload,
} from '@virtality/shared/types'

export type LiveLibraryEntry = Omit<VideoLibraryEntry, 'status'> & {
  /** `requested` is console-local: sent, not yet acknowledged by the headset. */
  status: VideoLibraryEntry['status'] | 'requested'
  stalled?: boolean
}

export type LiveLibraryState = {
  videos: LiveLibraryEntry[]
  freeBytes: number
}

const LIBRARY_STATUSES = new Set<LiveLibraryEntry['status']>([
  'requested',
  'downloading',
  'paused',
  'ready',
  'failed',
])

function isLibraryEntry(value: unknown): value is LiveLibraryEntry {
  if (value == null || typeof value !== 'object') return false
  const entry = value as LiveLibraryEntry
  return typeof entry.videoId === 'string' && LIBRARY_STATUSES.has(entry.status)
}

export function asLibraryVideos(videos: unknown): LiveLibraryEntry[] {
  return Array.isArray(videos) ? videos.filter(isLibraryEntry) : []
}

/**
 * `videoLibraryState` arrives as `{ videos: [{ videoId, status }], freeBytes }`
 * (camelCase, an array; `subscribe()` has already parsed the JSON text).
 * Entries with an unknown status are dropped rather than crashing the page.
 */
export function normalizeLiveLibraryState(payload: unknown): LiveLibraryState {
  const record =
    payload != null && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {}
  const freeBytes = record.freeBytes
  return {
    videos: asLibraryVideos(record.videos),
    freeBytes:
      typeof freeBytes === 'number' && Number.isFinite(freeBytes)
        ? freeBytes
        : 0,
  }
}

export function upsertLibraryEntry(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  videoId: string,
  patch: Partial<LiveLibraryEntry> & Pick<LiveLibraryEntry, 'status'>,
): LiveLibraryState {
  const videos = asLibraryVideos(state?.videos)
  const previous = videos.find((entry) => entry.videoId === videoId)
  const nextEntry: LiveLibraryEntry = {
    ...previous,
    ...patch,
    videoId,
  }
  return {
    freeBytes: state?.freeBytes ?? 0,
    videos: [...videos.filter((entry) => entry.videoId !== videoId), nextEntry],
  }
}

/**
 * Unity's download counter has been seen wrapping past 4 GiB, and the
 * headset's `sizeBytes` is an estimate that jitters between ticks. Never show
 * or store more bytes than the size we compare against; a bogus size
 * (missing or zero) leaves the count alone.
 */
export function clampBytesDownloaded(
  bytesDownloaded: number,
  sizeBytes: number | null | undefined,
): number {
  if (!Number.isFinite(bytesDownloaded) || bytesDownloaded < 0) return 0
  if (sizeBytes == null || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return bytesDownloaded
  }
  return Math.min(bytesDownloaded, sizeBytes)
}

export function applyDownloadProgress(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  payload: VideoDownloadProgressPayload,
): LiveLibraryState {
  return upsertLibraryEntry(state, payload.videoId, {
    status: 'downloading',
    bytesDownloaded: clampBytesDownloaded(
      payload.bytesDownloaded,
      payload.sizeBytes,
    ),
    sizeBytes: payload.sizeBytes,
    stalled: payload.stalled,
  })
}

/**
 * A finished file is whole by definition; the headset's last byte count is
 * an estimate and is dropped with the download.
 */
export function applyDownloadComplete(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  videoId: string,
): LiveLibraryState {
  return upsertLibraryEntry(state, videoId, {
    status: 'ready',
    bytesDownloaded: undefined,
    sizeBytes: undefined,
    stalled: false,
  })
}

export function applyDownloadFailed(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  payload: VideoDownloadFailedPayload,
): LiveLibraryState {
  return upsertLibraryEntry(state, payload.videoId, {
    status: 'failed',
    reason: payload.reason,
  })
}

export function applyDownloadPaused(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  payload: VideoDownloadPausedPayload,
): LiveLibraryState {
  return upsertLibraryEntry(state, payload.videoId, {
    status: 'paused',
    bytesDownloaded: payload.bytesDownloaded,
    stalled: false,
  })
}

export function applyDownloadRequested(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  videoId: string,
): LiveLibraryState {
  return upsertLibraryEntry(state, videoId, { status: 'requested' })
}

export function applyDownloadAck(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  videoId: string,
): LiveLibraryState {
  return upsertLibraryEntry(state, videoId, {
    status: 'downloading',
    bytesDownloaded: 0,
  })
}

export function removeLibraryEntry(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  videoId: string,
): LiveLibraryState {
  return {
    freeBytes: state?.freeBytes ?? 0,
    videos: asLibraryVideos(state?.videos).filter(
      (entry) => entry.videoId !== videoId,
    ),
  }
}

type MirrorDeviceLike = {
  deviceId: string
  report: null | { videos: Array<{ videoId: string; status: string }> }
}

/** `requested` rows the mirror holds for one headset (console intent). */
export function requestedVideoIds(
  mirror: { devices: MirrorDeviceLike[] } | null | undefined,
  deviceId: string | null | undefined,
): string[] {
  if (!mirror || !deviceId) return []
  const device = mirror.devices.find((entry) => entry.deviceId === deviceId)
  if (!device?.report) return []
  return device.report.videos
    .filter((video) => video.status === 'requested')
    .map((video) => video.videoId)
}

/**
 * A `requested` row is a Download Request the headset never acknowledged
 * (it was offline, or the ack was lost). Once the headset reports its
 * library, every such request it does not know about is sent again, once
 * per connection. A video the headset already reports needs no resend.
 */
export function selectDownloadsToResume(input: {
  requested: string[]
  live: LiveLibraryState | null
  alreadySent: ReadonlySet<string>
}): string[] {
  // `requested` in the live state is console-local, not headset knowledge.
  const reported = new Set(
    asLibraryVideos(input.live?.videos)
      .filter((entry) => entry.status !== 'requested')
      .map((entry) => entry.videoId),
  )
  return input.requested.filter(
    (videoId) => !reported.has(videoId) && !input.alreadySent.has(videoId),
  )
}
