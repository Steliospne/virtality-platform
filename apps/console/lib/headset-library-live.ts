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
  'absent',
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
  if (Array.isArray(videos)) {
    return videos.filter(isLibraryEntry)
  }
  if (videos != null && typeof videos === 'object') {
    return Object.values(videos).filter(isLibraryEntry)
  }
  return []
}

export function normalizeLiveLibraryState(payload: unknown): LiveLibraryState {
  const record =
    payload != null && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {}
  const freeBytesRaw = record.freeBytes ?? record.FreeBytes
  const freeBytes =
    typeof freeBytesRaw === 'number' && Number.isFinite(freeBytesRaw)
      ? freeBytesRaw
      : Number(freeBytesRaw)
  return {
    videos: asLibraryVideos(record.videos ?? record.Videos),
    freeBytes: Number.isFinite(freeBytes) ? freeBytes : 0,
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
 * The headset counts progress in a 32-bit integer and wraps past 4 GiB, so a
 * finished file can report `sizeBytes + 2^32`. Never show or store more bytes
 * than the file has; a bogus size (missing or zero) leaves the count alone.
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
 * `videoDownloadComplete` carries no version; the row is `ready` at whatever
 * version it already had until the next `videoLibraryState` reports the file.
 */
export function applyDownloadComplete(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  videoId: string,
): LiveLibraryState {
  return upsertLibraryEntry(state, videoId, {
    status: 'ready',
    stalled: false,
  })
}

export function applyDownloadFailed(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  payload: VideoDownloadFailedPayload,
): LiveLibraryState {
  if (payload.reason === 'cancelled') {
    return {
      freeBytes: state?.freeBytes ?? 0,
      videos: asLibraryVideos(state?.videos).filter(
        (entry) => entry.videoId !== payload.videoId,
      ),
    }
  }

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
 * per connection. A video the headset already reports (in any state but
 * `absent`) needs no resend.
 */
export function selectDownloadsToResume(input: {
  requested: string[]
  live: LiveLibraryState | null
  alreadySent: ReadonlySet<string>
}): string[] {
  // `requested` in the live state is console-local, not headset knowledge.
  const reported = new Set(
    asLibraryVideos(input.live?.videos)
      .filter(
        (entry) => entry.status !== 'absent' && entry.status !== 'requested',
      )
      .map((entry) => entry.videoId),
  )
  return input.requested.filter(
    (videoId) => !reported.has(videoId) && !input.alreadySent.has(videoId),
  )
}
