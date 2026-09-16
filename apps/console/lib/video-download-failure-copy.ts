import type { VideoDownloadFailureReason } from '@virtality/shared/types'

export type VideoDownloadFailureAction = 'Download' | 'Download (fresh)' | null

export type VideoDownloadFailureCopy = {
  copy: string | null
  action: VideoDownloadFailureAction
}

const FAILURE_COPY: Record<
  VideoDownloadFailureReason,
  VideoDownloadFailureCopy
> = {
  insufficient_storage: {
    copy: 'Not enough space on the headset. Free up space and try again.',
    action: 'Download',
  },
  network: {
    copy: 'The download failed. Try again.',
    action: 'Download',
  },
  checksum_mismatch: {
    copy: 'The file was corrupted in transfer. Try again.',
    action: 'Download (fresh)',
  },
  url_expired: {
    copy: 'The download failed. Try again.',
    action: 'Download',
  },
  unavailable: {
    copy: 'This video is no longer available.',
    action: null,
  },
}

export function videoDownloadFailureCopy(
  reason: VideoDownloadFailureReason,
): VideoDownloadFailureCopy {
  return FAILURE_COPY[reason]
}
