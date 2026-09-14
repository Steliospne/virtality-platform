import type {
  VideoDownloadCompletePayload,
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

export function applyDownloadProgress(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  payload: VideoDownloadProgressPayload,
): LiveLibraryState {
  return upsertLibraryEntry(state, payload.videoId, {
    status: 'downloading',
    bytesDownloaded: payload.bytesDownloaded,
    sizeBytes: payload.sizeBytes,
    stalled: payload.stalled,
  })
}

export function applyDownloadComplete(
  state: LiveLibraryState | VideoLibraryStatePayload | null,
  payload: VideoDownloadCompletePayload,
): LiveLibraryState {
  return upsertLibraryEntry(state, payload.videoId, {
    status: 'ready',
    version: payload.version,
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
