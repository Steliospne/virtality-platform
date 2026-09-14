import type { VideoDownloadFailureReason } from '@virtality/shared/types'
import type {
  HeadsetCatalogVideo,
  HeadsetLibrarySnapshot,
} from '@/lib/headset-library-rows'

export type DeviceVideoReportView = {
  reportedAt: string
  freeBytes: number | null
  videos: Array<{
    videoId: string
    status: 'requested' | 'downloading' | 'paused' | 'ready' | 'failed'
    version: number | null
    bytesDownloaded: number | null
    sizeBytes: number | null
    reason: VideoDownloadFailureReason | null
  }>
}

export type HeadsetListItem = {
  id: string
  name: string
  online: boolean
  readyCount: number
  totalCount: number
  freeBytes: number | null
  reportedAt: string | null
  usedBytes: number
}

export function toLibrarySnapshot(
  report: DeviceVideoReportView | null | undefined,
): HeadsetLibrarySnapshot | null {
  if (!report) return null
  const videos = Array.isArray(report.videos) ? report.videos : []
  return {
    freeBytes: report.freeBytes,
    reportedAt: report.reportedAt,
    videos: videos.map((video) => ({
      videoId: video.videoId,
      status: video.status,
      version: video.version,
      bytesDownloaded: video.bytesDownloaded,
      sizeBytes: video.sizeBytes,
      reason: video.reason ?? undefined,
    })),
  }
}

export function vrVideoBanner(input: {
  roomComplete: boolean
  replaced: boolean
  pollOnline: boolean
}): string | null {
  if (input.replaced || input.roomComplete) return null
  if (input.pollOnline) return 'Connecting to headset…'
  return 'Turn the headset on and open the app to download videos.'
}

export function selectedHeadsetOnline(input: {
  roomComplete: boolean
  pollOnline: boolean
}): boolean {
  return input.roomComplete || input.pollOnline
}

export function toCatalogVideos(
  videos:
    | Array<{
        id: string
        title: string
        activity: 'CYCLING' | 'WALKING'
        durationSec: number | null
        sizeBytes: number
        version: number
        thumbnailUrl: string | null
      }>
    | undefined,
): HeadsetCatalogVideo[] {
  return Array.isArray(videos) ? videos : []
}

/**
 * While online the headset's live report wins, but it cannot know about a
 * `requested` row (console intent). Carry those over so the physio can see
 * and withdraw a request the headset never acknowledged.
 */
export function overlayRequestedRows(
  live: HeadsetLibrarySnapshot,
  mirror: HeadsetLibrarySnapshot | null,
): HeadsetLibrarySnapshot {
  if (!mirror) return live
  const known = new Set(live.videos.map((video) => video.videoId))
  const requested = mirror.videos.filter(
    (video) => video.status === 'requested' && !known.has(video.videoId),
  )
  return requested.length === 0
    ? live
    : { ...live, videos: [...live.videos, ...requested] }
}
