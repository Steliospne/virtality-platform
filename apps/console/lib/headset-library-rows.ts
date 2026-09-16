import type { VideoDownloadFailureReason } from '@virtality/shared/types'
import { downloadPercent } from './headset-library-format'

export type HeadsetCatalogVideo = {
  id: string
  title: string
  activity: 'CYCLING' | 'WALKING'
  durationSec: number | null
  sizeBytes: number
  thumbnailUrl: string | null
}

export type HeadsetLibraryEntry = {
  videoId: string
  status: 'requested' | 'downloading' | 'paused' | 'ready' | 'failed'
  bytesDownloaded?: number | null
  sizeBytes?: number | null
  reason?: VideoDownloadFailureReason | null
  stalled?: boolean
}

export type HeadsetLibrarySnapshot = {
  videos: HeadsetLibraryEntry[]
  freeBytes: number | null
  /** When the headset last reported; absent until it has. */
  reportedAt?: string | null
}

export type HeadsetLibraryCell =
  | { type: 'on-headset' }
  | {
      type: 'downloading'
      percent: number
      stalled: boolean
    }
  | {
      type: 'paused'
      bytesDownloaded: number
      sizeBytes: number
    }
  | { type: 'failed'; reason: VideoDownloadFailureReason }
  | { type: 'absent' }
  | { type: 'requested' }
  | { type: 'offline-requested' }
  | { type: 'offline-on-headset'; reportedAt?: string | null }
  | { type: 'offline-absent' }
  | { type: 'not-in-catalog' }
  | {
      type: 'offline-downloading'
      percent: number
      stalled: boolean
    }
  | {
      type: 'offline-paused'
      bytesDownloaded: number
      sizeBytes: number
    }
  | { type: 'offline-failed'; reason: VideoDownloadFailureReason }

export type HeadsetLibraryRow = {
  videoId: string
  title: string
  activity: HeadsetCatalogVideo['activity'] | null
  durationSec: number | null
  sizeBytes: number
  thumbnailUrl: string | null
  inCatalog: boolean
  cell: HeadsetLibraryCell
}

function snapshotVideos(
  snapshot: HeadsetLibrarySnapshot | null,
): HeadsetLibraryEntry[] {
  const videos = snapshot?.videos
  return Array.isArray(videos) ? videos : []
}

function entryByVideoId(
  snapshot: HeadsetLibrarySnapshot | null,
): Map<string, HeadsetLibraryEntry> {
  const map = new Map<string, HeadsetLibraryEntry>()
  for (const entry of snapshotVideos(snapshot)) {
    map.set(entry.videoId, entry)
  }
  return map
}

function downloadingCell(
  entry: HeadsetLibraryEntry,
  catalogSize: number,
  online: boolean,
): HeadsetLibraryCell {
  const sizeBytes = entry.sizeBytes ?? catalogSize
  const percent = downloadPercent(entry.bytesDownloaded ?? 0, sizeBytes)
  if (online) {
    return { type: 'downloading', percent, stalled: entry.stalled === true }
  }
  return {
    type: 'offline-downloading',
    percent,
    stalled: entry.stalled === true,
  }
}

function pausedCell(
  entry: HeadsetLibraryEntry,
  catalogSize: number,
  online: boolean,
): HeadsetLibraryCell {
  const sizeBytes = entry.sizeBytes ?? catalogSize
  if (online) {
    return {
      type: 'paused',
      bytesDownloaded: entry.bytesDownloaded ?? 0,
      sizeBytes,
    }
  }
  return {
    type: 'offline-paused',
    bytesDownloaded: entry.bytesDownloaded ?? 0,
    sizeBytes,
  }
}

/** No row is "absent": the headset lists only videos it holds. */
function cellForCatalogEntry(
  entry: HeadsetLibraryEntry | undefined,
  catalog: HeadsetCatalogVideo,
  online: boolean,
  reportedAt: string | null | undefined,
): HeadsetLibraryCell {
  if (!entry) {
    return online ? { type: 'absent' } : { type: 'offline-absent' }
  }

  switch (entry.status) {
    case 'ready':
      if (online) return { type: 'on-headset' }
      return { type: 'offline-on-headset', reportedAt }
    case 'downloading':
      return downloadingCell(entry, catalog.sizeBytes, online)
    case 'paused':
      return pausedCell(entry, catalog.sizeBytes, online)
    case 'failed':
      return online
        ? { type: 'failed', reason: entry.reason ?? 'network' }
        : { type: 'offline-failed', reason: entry.reason ?? 'network' }
    case 'requested':
      return online ? { type: 'requested' } : { type: 'offline-requested' }
  }
}

export function buildHeadsetLibraryRows(
  catalog: HeadsetCatalogVideo[],
  snapshot: HeadsetLibrarySnapshot | null,
  online: boolean,
): HeadsetLibraryRow[] {
  const entries = entryByVideoId(snapshot)
  const catalogIds = new Set(catalog.map((video) => video.id))
  const reportedAt = snapshot?.reportedAt

  const catalogRows: HeadsetLibraryRow[] = catalog.map((video) => ({
    videoId: video.id,
    title: video.title,
    activity: video.activity,
    durationSec: video.durationSec,
    sizeBytes: video.sizeBytes,
    thumbnailUrl: video.thumbnailUrl,
    inCatalog: true,
    cell: cellForCatalogEntry(entries.get(video.id), video, online, reportedAt),
  }))

  const extras: HeadsetLibraryRow[] = []
  for (const entry of snapshotVideos(snapshot)) {
    if (catalogIds.has(entry.videoId)) continue
    extras.push({
      videoId: entry.videoId,
      title: 'Not in catalog',
      activity: null,
      durationSec: null,
      sizeBytes: entry.sizeBytes ?? 0,
      thumbnailUrl: null,
      inCatalog: false,
      cell: { type: 'not-in-catalog' },
    })
  }

  return [...catalogRows, ...extras]
}

export function countReadyOnHeadset(
  catalog: HeadsetCatalogVideo[],
  snapshot: HeadsetLibrarySnapshot | null,
): number {
  const entries = entryByVideoId(snapshot)
  return catalog.filter((video) => entries.get(video.id)?.status === 'ready')
    .length
}

export function usedBytesOnHeadset(
  snapshot: HeadsetLibrarySnapshot | null,
): number {
  return snapshotVideos(snapshot).reduce((sum, entry) => {
    if (entry.status !== 'ready') return sum
    return sum + (entry.sizeBytes ?? 0)
  }, 0)
}
