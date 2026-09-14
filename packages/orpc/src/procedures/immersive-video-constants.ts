export const IMMERSIVE_VIDEO_PART_SIZE_BYTES = 67_108_864

/**
 * Every Immersive Video object lives flat under this prefix, which is also the
 * headset's Addressables `Remote.LoadPath` (`https://cdn.virtality.app/immersive-videos`).
 */
export const IMMERSIVE_VIDEO_OBJECT_PREFIX = 'immersive-videos'

/** Unity AssetBundle built from the headset project's Addressables group, one video per bundle. */
export const IMMERSIVE_VIDEO_BUNDLE_EXTENSIONS = ['bundle'] as const

/**
 * A bundle keeps the filename Unity generated: the Addressables catalog refers
 * to it by that name relative to the load path, so renaming it would break
 * resolution on the headset. Restricted to a safe S3 key / URL path segment.
 */
export const IMMERSIVE_VIDEO_BUNDLE_FILENAME_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}\.bundle$/

/**
 * The Addressables catalog pair Unity writes next to the bundles. The `.hash`
 * is the one mutable pointer headsets poll, so it must never be cached.
 */
export const ADDRESSABLES_CATALOG_FILENAME_PATTERN =
  /^catalog_[A-Za-z0-9._-]{1,120}\.(bin|json)$/
export const ADDRESSABLES_CATALOG_HASH_FILENAME_PATTERN =
  /^catalog_[A-Za-z0-9._-]{1,120}\.hash$/
export const ADDRESSABLES_CATALOG_HASH_CACHE_CONTROL = 'no-cache'
export const ADDRESSABLES_CATALOG_MAX_BYTES = 8 * 1024 * 1024

/** Raw video the headset plays through `VideoPlayer.url`. */
export const IMMERSIVE_VIDEO_RAW_EXTENSIONS = [
  'mp4',
  'm4v',
  'mov',
  'webm',
  'mkv',
] as const

export const IMMERSIVE_VIDEO_ALLOWED_EXTENSIONS = [
  ...IMMERSIVE_VIDEO_BUNDLE_EXTENSIONS,
  ...IMMERSIVE_VIDEO_RAW_EXTENSIONS,
] as const

const IMMERSIVE_VIDEO_CONTENT_TYPES: Record<
  (typeof IMMERSIVE_VIDEO_ALLOWED_EXTENSIONS)[number],
  string
> = {
  bundle: 'application/octet-stream',
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
}

/**
 * Admin-chosen Video ID: safe as an S3 key segment, a headset filename and a
 * URL path segment. Lowercase so the same id never differs only by case.
 */
export const IMMERSIVE_VIDEO_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/

export type ImmersiveVideoActivity = 'CYCLING' | 'WALKING'

export type ImmersiveVideoCatalogState =
  | 'Draft'
  | 'Uploading'
  | 'Verifying'
  | 'Published'
  | 'Republishing'
  | 'Unpublished'

export const LIVE_IMMERSIVE_VIDEO_STATES = [
  'Published',
  'Republishing',
] as const satisfies readonly ImmersiveVideoCatalogState[]

export type ImmersiveVideoRecord = {
  id: string
  title: string
  activity: ImmersiveVideoActivity
  description: string | null
  state: ImmersiveVideoCatalogState
  priorState: ImmersiveVideoCatalogState | null
  version: number
  objectKey: string | null
  sizeBytes: bigint | number | null
  checksum: string | null
  durationSec: number | null
  filename: string | null
  thumbnailKey: string | null
  uploadId: string | null
  uploadObjectKey: string | null
  uploadFilename: string | null
  uploadSizeBytes: bigint | number | null
  uploadDurationSec: number | null
  verifyFailedAt: Date | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type ImmersiveVideoAdminRow = {
  id: string
  title: string
  activity: ImmersiveVideoActivity
  description: string | null
  state: ImmersiveVideoCatalogState
  version: number
  sizeBytes: number | null
  durationSec: number | null
  thumbnailUrl: string | null
  filename: string | null
  uploadProgress?: { uploadedParts: number; partCount: number }
  verifyFailedAt: Date | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export function immersiveVideoPartCount(sizeBytes: number): number {
  if (sizeBytes <= 0) {
    return 0
  }
  return Math.ceil(sizeBytes / IMMERSIVE_VIDEO_PART_SIZE_BYTES)
}

export function expectedImmersiveVideoPartSize(
  sizeBytes: number,
  partNumber: number,
): number {
  const partCount = immersiveVideoPartCount(sizeBytes)
  if (partNumber < 1 || partNumber > partCount) {
    return 0
  }
  const start = (partNumber - 1) * IMMERSIVE_VIDEO_PART_SIZE_BYTES
  return Math.min(IMMERSIVE_VIDEO_PART_SIZE_BYTES, sizeBytes - start)
}

export function immersiveVideoFileExtension(filename: string): string | null {
  const trimmed = filename.trim()
  const dot = trimmed.lastIndexOf('.')
  if (dot <= 0 || dot === trimmed.length - 1) {
    return null
  }
  return trimmed.slice(dot + 1).toLowerCase()
}

export function isAllowedImmersiveVideoExtension(
  extension: string | null,
): boolean {
  if (!extension) {
    return false
  }
  return (IMMERSIVE_VIDEO_ALLOWED_EXTENSIONS as readonly string[]).includes(
    extension,
  )
}

export function immersiveVideoContentType(extension: string): string {
  return (
    (IMMERSIVE_VIDEO_CONTENT_TYPES as Record<string, string>)[extension] ??
    'application/octet-stream'
  )
}

export function isValidImmersiveVideoId(id: string): boolean {
  return IMMERSIVE_VIDEO_ID_PATTERN.test(id)
}

export function isBundleExtension(extension: string): boolean {
  return (IMMERSIVE_VIDEO_BUNDLE_EXTENSIONS as readonly string[]).includes(
    extension,
  )
}

export function isValidImmersiveVideoBundleFilename(filename: string): boolean {
  return IMMERSIVE_VIDEO_BUNDLE_FILENAME_PATTERN.test(filename)
}

/**
 * Where a video's file lands. A bundle keeps its Unity filename (the catalog
 * resolves it by name); a raw video is renamed to `<videoId>.<ext>` so the
 * headset's `VideoPlayer.url` path stays the Video ID.
 */
export function immersiveVideoObjectKey(
  videoId: string,
  extension: string,
  filename: string,
): string {
  const name = isBundleExtension(extension)
    ? filename.trim()
    : `${videoId}.${extension}`
  return `${IMMERSIVE_VIDEO_OBJECT_PREFIX}/${name}`
}

export function isAddressablesCatalogFilename(filename: string): boolean {
  return ADDRESSABLES_CATALOG_FILENAME_PATTERN.test(filename)
}

export function isAddressablesCatalogHashFilename(filename: string): boolean {
  return ADDRESSABLES_CATALOG_HASH_FILENAME_PATTERN.test(filename)
}

/** `catalog_<ts>.bin` and `catalog_<ts>.hash` must share the same `<ts>` stem. */
export function addressablesCatalogStem(filename: string): string | null {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(0, dot) : null
}

export function addressablesCatalogObjectKey(filename: string): string {
  return `${IMMERSIVE_VIDEO_OBJECT_PREFIX}/${filename.trim()}`
}

export function toSizeBytesNumber(
  value: bigint | number | null | undefined,
): number | null {
  if (value == null) {
    return null
  }
  return typeof value === 'bigint' ? Number(value) : value
}

export function isImmersiveVideoDiscardEmpty(row: {
  title: string
  description: string | null | undefined
  thumbnailKey: string | null | undefined
  uploadId: string | null | undefined
  objectKey: string | null | undefined
}): boolean {
  return (
    row.title === '' &&
    (row.description == null || row.description === '') &&
    row.thumbnailKey == null &&
    row.uploadId == null &&
    row.objectKey == null
  )
}

export class ImmersiveVideoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImmersiveVideoError'
  }
}

export class ImmersiveVideoNotFoundError extends ImmersiveVideoError {
  constructor(id: string) {
    super(`Immersive video ${id} was not found.`)
    this.name = 'ImmersiveVideoNotFoundError'
  }
}
