import type { MosaicTileListItem } from '@virtality/shared/types'

export type MosaicTileImage = {
  src: string
  alt: string
}

export type MosaicTileVideo = {
  src: string
  alt: string
  mimeType?: string
}

const MOSAIC_VIDEO_MIME_TYPES = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
} as const

export function inferMosaicVideoMimeType(
  objectKey: string,
): string | undefined {
  const extension = objectKey.trim().split('.').pop()?.toLowerCase()

  if (!extension || !(extension in MOSAIC_VIDEO_MIME_TYPES)) {
    return undefined
  }

  return MOSAIC_VIDEO_MIME_TYPES[
    extension as keyof typeof MOSAIC_VIDEO_MIME_TYPES
  ]
}

function getTrimmedMosaicMedia(
  tile: Pick<MosaicTileListItem, 'cdnUrl' | 'alt'>,
): MosaicTileImage | null {
  const src = tile.cdnUrl.trim()
  const alt = tile.alt.trim()

  if (!src || !alt) {
    return null
  }

  return { src, alt }
}

export function getMosaicImageTileProps(
  tile: Pick<MosaicTileListItem, 'mediaKind' | 'cdnUrl' | 'alt'>,
): MosaicTileImage | null {
  if (tile.mediaKind !== 'image') {
    return null
  }

  return getTrimmedMosaicMedia(tile)
}

export function getMosaicVideoTileProps(
  tile: Pick<MosaicTileListItem, 'mediaKind' | 'cdnUrl' | 'alt' | 'objectKey'>,
): MosaicTileVideo | null {
  if (tile.mediaKind !== 'video') {
    return null
  }

  const media = getTrimmedMosaicMedia(tile)

  if (!media) {
    return null
  }

  return {
    ...media,
    mimeType: inferMosaicVideoMimeType(tile.objectKey),
  }
}

/**
 * Chromium reports canPlayType('video/quicktime') as "" and skips
 * `<source type="video/quicktime">` even when the same .mov plays via `<video src>`.
 * Prefer a bare src (promo-video pattern) so the browser can sniff the container.
 */
export function getMosaicVideoElementSrcProps(
  tileVideo: Pick<MosaicTileVideo, 'src' | 'alt'>,
): { src: string; 'aria-label': string } {
  return {
    src: tileVideo.src,
    'aria-label': tileVideo.alt,
  }
}
