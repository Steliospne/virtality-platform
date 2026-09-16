export type ImmersiveVideoActivity = 'CYCLING' | 'WALKING'

export type ImmersiveVideoCatalogState =
  | 'Draft'
  | 'Uploading'
  | 'Verifying'
  | 'Published'
  | 'Republishing'
  | 'Unpublished'

export type ImmersiveVideoAdminRow = {
  id: string
  title: string
  activity: ImmersiveVideoActivity
  description: string | null
  state: ImmersiveVideoCatalogState
  sizeBytes: number | null
  durationSec: number | null
  thumbnailUrl: string | null
  filename: string | null
  uploadProgress?: { uploadedParts: number; partCount: number }
  verifyFailedAt: Date | string | null
  publishedAt: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export function immersiveVideoHasFile(row: ImmersiveVideoAdminRow): boolean {
  return Boolean(row.filename) || (row.sizeBytes != null && row.sizeBytes > 0)
}

export function immersiveVideoUploadPercent(
  row: ImmersiveVideoAdminRow,
): number | null {
  const progress = row.uploadProgress
  if (!progress || progress.partCount === 0) {
    return null
  }
  return Math.round((progress.uploadedParts / progress.partCount) * 100)
}

export type ImmersiveVideoRowAction =
  | 'Edit'
  | 'Upload file'
  | 'Delete'
  | 'Resume upload'
  | 'Cancel upload'
  | 'Publish'
  | 'Replace file'
  | 'Unpublish'
  | 'Cancel replace'

export function immersiveVideoRowActions(
  row: ImmersiveVideoAdminRow,
): ImmersiveVideoRowAction[] {
  if (row.state === 'Uploading') {
    return ['Resume upload', 'Cancel upload', 'Edit', 'Delete']
  }
  if (row.state === 'Verifying') {
    return ['Edit']
  }
  if (row.state === 'Republishing') {
    return ['Edit', 'Cancel replace']
  }
  if (row.state === 'Published') {
    return ['Edit', 'Unpublish', 'Replace file', 'Delete']
  }
  if (row.state === 'Unpublished') {
    return ['Edit', 'Publish', 'Replace file', 'Delete']
  }
  if (immersiveVideoHasFile(row)) {
    return ['Edit', 'Publish', 'Replace file', 'Delete']
  }
  return ['Edit', 'Upload file', 'Delete']
}

export function immersiveVideoStateBadgeLabel(
  row: ImmersiveVideoAdminRow,
): string {
  if (row.state === 'Draft' && !immersiveVideoHasFile(row)) {
    return 'Draft · no file'
  }
  return row.state
}

export function formatImmersiveVideoSize(sizeBytes: number | null): string {
  if (sizeBytes == null) {
    return '–'
  }
  if (sizeBytes >= 1_000_000_000) {
    return `${(sizeBytes / 1_000_000_000).toFixed(1)} GB`
  }
  if (sizeBytes >= 1_000_000) {
    return `${(sizeBytes / 1_000_000).toFixed(1)} MB`
  }
  if (sizeBytes >= 1000) {
    return `${(sizeBytes / 1000).toFixed(1)} KB`
  }
  return `${sizeBytes} B`
}

export function formatImmersiveVideoDuration(
  durationSec: number | null,
): string {
  if (durationSec == null) {
    return '–'
  }
  const hours = Math.floor(durationSec / 3600)
  const minutes = Math.floor((durationSec % 3600) / 60)
  const seconds = durationSec % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

export type ImmersiveVideoUploadProgressView = {
  label: string
  percent: number
}

/** Progress for the upload running in this browser tab, with byte counts. */
export function liveImmersiveVideoUploadProgress(
  uploadedBytes: number,
  totalBytes: number,
): ImmersiveVideoUploadProgressView {
  const percent =
    totalBytes === 0 ? 0 : Math.round((uploadedBytes / totalBytes) * 100)
  return {
    label: `${formatImmersiveVideoSize(uploadedBytes)} of ${formatImmersiveVideoSize(totalBytes)} · ${percent} %`,
    percent,
  }
}

/**
 * Progress for an Uploading row this tab is not driving (paused, or started
 * elsewhere); only the server's part count is known.
 */
export function storedImmersiveVideoUploadProgress(
  row: ImmersiveVideoAdminRow,
): ImmersiveVideoUploadProgressView | null {
  const percent = immersiveVideoUploadPercent(row)
  if (percent == null) return null
  return { label: `Paused · ${percent} %`, percent }
}

export function publishPreconditionLabel(
  row: ImmersiveVideoAdminRow,
): string | null {
  if (!row.thumbnailUrl) {
    return 'Add a thumbnail to publish'
  }
  if (!immersiveVideoHasFile(row)) {
    return 'Upload a file to publish'
  }
  if (!row.title.trim()) {
    return 'Add a title to publish'
  }
  return null
}
