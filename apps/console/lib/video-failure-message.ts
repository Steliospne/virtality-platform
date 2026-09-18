import type {
  VideoDownloadFailedPayload,
  VideoDownloadFailureReason,
} from '@virtality/shared/types'

const REASON_LABEL: Record<VideoDownloadFailureReason, string> = {
  insufficient_storage: 'not enough space on the headset',
  network: 'network error',
  checksum_mismatch: 'file corrupted',
  url_expired: 'download link expired',
  unavailable: 'video not available',
}

/** Toast copy for a headset failure event, e.g. `Delete failed (vid-1): network error`. */
export function videoFailureMessage(
  prefix: string,
  payload: VideoDownloadFailedPayload,
): string {
  const label = REASON_LABEL[payload.reason] ?? payload.reason
  return `${prefix} (${payload.videoId}): ${label}`
}
