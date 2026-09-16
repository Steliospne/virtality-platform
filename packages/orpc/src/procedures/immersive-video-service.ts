import type { PrismaClient } from '@virtality/db'
import { bucketCdnUrl, generateUUID } from '@virtality/shared/utils'
import {
  expectedImmersiveVideoPartSize,
  IMMERSIVE_VIDEO_PART_SIZE_BYTES,
  immersiveVideoContentType,
  immersiveVideoFileExtension,
  immersiveVideoObjectKey,
  immersiveVideoPartCount,
  ImmersiveVideoError,
  ImmersiveVideoNotFoundError,
  isAllowedImmersiveVideoExtension,
  isBundleExtension,
  isImmersiveVideoDiscardEmpty,
  isValidImmersiveVideoBundleFilename,
  isValidImmersiveVideoId,
  LIVE_IMMERSIVE_VIDEO_STATES,
  toSizeBytesNumber,
  type ImmersiveVideoActivity,
  type ImmersiveVideoAdminRow,
  type ImmersiveVideoCatalogState,
  type ImmersiveVideoRecord,
} from './immersive-video-constants.ts'
import type { ImmersiveVideoS3 } from './immersive-video-s3.ts'

export type ImmersiveVideoPrisma = PrismaClient

type ServiceDeps = {
  prisma: ImmersiveVideoPrisma
  s3: ImmersiveVideoS3
}

const UPLOADABLE_STATES: ImmersiveVideoCatalogState[] = [
  'Draft',
  'Unpublished',
  'Published',
]

const PUBLISHABLE_STATES: ImmersiveVideoCatalogState[] = [
  'Draft',
  'Unpublished',
]

function asRecord(row: ImmersiveVideoRecord | null, id: string) {
  if (!row) {
    throw new ImmersiveVideoNotFoundError(id)
  }
  return row
}

async function loadVideo(
  prisma: ImmersiveVideoPrisma,
  id: string,
): Promise<ImmersiveVideoRecord> {
  const row = await prisma.immersiveVideo.findUnique({ where: { id } })
  return asRecord(row, id)
}

export function toImmersiveVideoAdminRow(
  row: ImmersiveVideoRecord,
  uploadProgress?: { uploadedParts: number; partCount: number },
): ImmersiveVideoAdminRow {
  return {
    id: row.id,
    title: row.title,
    activity: row.activity,
    description: row.description,
    state: row.state,
    sizeBytes: toSizeBytesNumber(row.sizeBytes),
    durationSec: row.durationSec,
    thumbnailUrl: row.thumbnailKey ? bucketCdnUrl(row.thumbnailKey) : null,
    filename: row.filename ?? row.uploadFilename,
    ...(uploadProgress ? { uploadProgress } : {}),
    verifyFailedAt: row.verifyFailedAt,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

async function withUploadProgress(
  s3: ImmersiveVideoS3,
  row: ImmersiveVideoRecord,
): Promise<ImmersiveVideoAdminRow> {
  const uploadSize = toSizeBytesNumber(row.uploadSizeBytes)
  if (
    !row.uploadId ||
    !row.uploadObjectKey ||
    uploadSize == null ||
    (row.state !== 'Uploading' && row.state !== 'Republishing')
  ) {
    return toImmersiveVideoAdminRow(row)
  }

  const parts = await s3.listParts({
    key: row.uploadObjectKey,
    uploadId: row.uploadId,
  })
  return toImmersiveVideoAdminRow(row, {
    uploadedParts: parts.length,
    partCount: immersiveVideoPartCount(uploadSize),
  })
}

const FILE_CLEAR = {
  objectKey: null,
  sizeBytes: null,
  checksum: null,
  filename: null,
  durationSec: null,
}

const UPLOAD_CLEAR = {
  uploadId: null,
  uploadObjectKey: null,
  uploadFilename: null,
  uploadSizeBytes: null,
  uploadDurationSec: null,
}

export async function listImmersiveVideoCatalog(
  deps: ServiceDeps,
): Promise<ImmersiveVideoAdminRow[]> {
  const rows = await deps.prisma.immersiveVideo.findMany({
    orderBy: { updatedAt: 'desc' },
  })
  return Promise.all(rows.map((row) => withUploadProgress(deps.s3, row)))
}

export type ImmersiveVideoConsoleListItem = {
  id: string
  title: string
  activity: ImmersiveVideoActivity
  description: string | null
  durationSec: number | null
  sizeBytes: number
  thumbnailUrl: string | null
}

export async function listPublishedImmersiveVideos(
  prisma: ImmersiveVideoPrisma,
): Promise<ImmersiveVideoConsoleListItem[]> {
  const rows = await prisma.immersiveVideo.findMany({
    where: { state: { in: [...LIVE_IMMERSIVE_VIDEO_STATES] } },
    orderBy: [{ activity: 'asc' }, { title: 'asc' }],
  })

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    activity: row.activity,
    description: row.description,
    durationSec: row.durationSec,
    sizeBytes: toSizeBytesNumber(row.sizeBytes) ?? 0,
    thumbnailUrl: row.thumbnailKey ? bucketCdnUrl(row.thumbnailKey) : null,
  }))
}

export async function getImmersiveVideo(
  deps: ServiceDeps,
  id: string,
): Promise<ImmersiveVideoAdminRow> {
  const row = await loadVideo(deps.prisma, id)
  return withUploadProgress(deps.s3, row)
}

export async function createImmersiveVideo(
  deps: ServiceDeps,
): Promise<{ id: string }> {
  const row = await deps.prisma.immersiveVideo.create({
    data: {
      title: '',
      activity: 'CYCLING',
      state: 'Draft',
    },
  })
  return { id: row.id }
}

export async function updateImmersiveVideo(
  deps: ServiceDeps,
  input: {
    id: string
    title?: string
    activity?: ImmersiveVideoActivity
    description?: string | null
  },
): Promise<ImmersiveVideoAdminRow> {
  const row = await loadVideo(deps.prisma, input.id)

  if (input.title !== undefined) {
    if (input.title.length > 120) {
      throw new ImmersiveVideoError('TITLE_TOO_LONG')
    }
    if (input.title.length === 0 && row.state !== 'Draft') {
      throw new ImmersiveVideoError('TITLE_REQUIRED')
    }
  }

  if (input.description !== undefined && input.description != null) {
    if (input.description.length > 500) {
      throw new ImmersiveVideoError('DESCRIPTION_TOO_LONG')
    }
  }

  const updated = await deps.prisma.immersiveVideo.update({
    where: { id: input.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.activity !== undefined ? { activity: input.activity } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
    },
  })
  return withUploadProgress(deps.s3, updated)
}

export async function setImmersiveVideoThumbnail(
  deps: ServiceDeps,
  input: { id: string; file: File },
): Promise<{ thumbnailKey: string; thumbnailUrl: string }> {
  const row = await loadVideo(deps.prisma, input.id)
  const thumbnailKey = `immersive-videos/${row.id}/thumbnail-${generateUUID()}.jpg`
  const body = Buffer.from(await input.file.arrayBuffer())
  await deps.s3.putObject({
    key: thumbnailKey,
    body,
    contentType: input.file.type || 'image/jpeg',
  })
  await deps.prisma.immersiveVideo.update({
    where: { id: row.id },
    data: { thumbnailKey },
  })
  if (row.thumbnailKey) {
    await deps.s3.deleteObject({ key: row.thumbnailKey })
  }
  return { thumbnailKey, thumbnailUrl: bucketCdnUrl(thumbnailKey) }
}

export async function discardImmersiveVideoIfEmpty(
  deps: ServiceDeps,
  id: string,
): Promise<{ deleted: boolean }> {
  const row = await loadVideo(deps.prisma, id)
  if (!isImmersiveVideoDiscardEmpty(row)) {
    return { deleted: false }
  }
  await deps.prisma.immersiveVideo.delete({ where: { id } })
  return { deleted: true }
}

export async function publishImmersiveVideo(
  deps: ServiceDeps,
  id: string,
): Promise<ImmersiveVideoAdminRow> {
  const row = await loadVideo(deps.prisma, id)
  if (!PUBLISHABLE_STATES.includes(row.state)) {
    throw new ImmersiveVideoError('NOT_PUBLISHABLE')
  }
  if (!row.objectKey || !row.checksum || !row.thumbnailKey) {
    throw new ImmersiveVideoError('PUBLISH_PRECONDITIONS')
  }
  const updated = await deps.prisma.immersiveVideo.update({
    where: { id },
    data: {
      state: 'Published',
      publishedAt: row.publishedAt ?? new Date(),
    },
  })
  return toImmersiveVideoAdminRow(updated)
}

export async function unpublishImmersiveVideo(
  deps: ServiceDeps,
  id: string,
): Promise<ImmersiveVideoAdminRow> {
  const row = await loadVideo(deps.prisma, id)
  if (row.state !== 'Published') {
    throw new ImmersiveVideoError('NOT_PUBLISHED')
  }
  const updated = await deps.prisma.immersiveVideo.update({
    where: { id },
    data: { state: 'Unpublished' },
  })
  return toImmersiveVideoAdminRow(updated)
}

export async function deleteImmersiveVideo(
  deps: ServiceDeps,
  id: string,
): Promise<void> {
  const row = await loadVideo(deps.prisma, id)

  if (row.uploadId && row.uploadObjectKey) {
    await deps.s3.abortMultipartUpload({
      key: row.uploadObjectKey,
      uploadId: row.uploadId,
    })
  }

  const keys = new Set<string>()
  if (row.objectKey) keys.add(row.objectKey)
  if (row.uploadObjectKey) keys.add(row.uploadObjectKey)
  if (row.thumbnailKey) keys.add(row.thumbnailKey)

  for (const key of keys) {
    await deps.s3.deleteObject({ key })
  }

  await deps.prisma.deviceVideo.deleteMany({ where: { videoId: id } })
  await deps.prisma.immersiveVideo.delete({ where: { id } })
}

/**
 * The Video ID is the key headsets, the console and the object key all share.
 * It may be chosen once, on the first upload, while no file has ever been
 * verified for the row; after that headsets may hold files under it.
 */
async function resolveUploadVideoId(
  prisma: ImmersiveVideoPrisma,
  row: ImmersiveVideoRecord,
  requested: string | undefined,
): Promise<string> {
  const videoId = requested?.trim()
  if (!videoId || videoId === row.id) {
    return row.id
  }
  if (!isValidImmersiveVideoId(videoId)) {
    throw new ImmersiveVideoError('INVALID_VIDEO_ID')
  }
  if (row.objectKey) {
    throw new ImmersiveVideoError('VIDEO_ID_LOCKED')
  }
  const taken = await prisma.immersiveVideo.findUnique({
    where: { id: videoId },
    select: { id: true },
  })
  if (taken) {
    throw new ImmersiveVideoError('VIDEO_ID_TAKEN')
  }
  await prisma.immersiveVideo.update({
    where: { id: row.id },
    data: { id: videoId },
  })
  return videoId
}

export async function startImmersiveVideoUpload(
  deps: ServiceDeps,
  input: {
    id: string
    videoId?: string | null
    filename: string
    sizeBytes: number
    durationSec?: number | null
  },
): Promise<{
  id: string
  uploadId: string
  partSizeBytes: number
  partCount: number
}> {
  const row = await loadVideo(deps.prisma, input.id)
  if (row.uploadId) {
    throw new ImmersiveVideoError('UPLOAD_IN_PROGRESS')
  }
  if (!UPLOADABLE_STATES.includes(row.state)) {
    throw new ImmersiveVideoError('UPLOAD_NOT_ALLOWED')
  }
  const extension = immersiveVideoFileExtension(input.filename)
  if (!extension || !isAllowedImmersiveVideoExtension(extension)) {
    throw new ImmersiveVideoError('INVALID_FILENAME')
  }
  if (
    isBundleExtension(extension) &&
    !isValidImmersiveVideoBundleFilename(input.filename.trim())
  ) {
    throw new ImmersiveVideoError('INVALID_BUNDLE_FILENAME')
  }

  const id = await resolveUploadVideoId(
    deps.prisma,
    row,
    input.videoId ?? undefined,
  )

  // One object per video. A raw video republish uploads onto the live key and
  // S3 swaps the bytes at Complete; a bundle republish lands on the new Unity
  // filename and verify deletes the previous key.
  const uploadObjectKey = immersiveVideoObjectKey(id, extension, input.filename)
  const { uploadId } = await deps.s3.createMultipartUpload({
    key: uploadObjectKey,
    contentType: immersiveVideoContentType(extension),
  })

  const nextState: ImmersiveVideoCatalogState =
    row.state === 'Published' ? 'Republishing' : 'Uploading'

  await deps.prisma.immersiveVideo.update({
    where: { id },
    data: {
      priorState: row.state,
      state: nextState,
      verifyFailedAt: null,
      uploadId,
      uploadObjectKey,
      uploadFilename: input.filename,
      uploadSizeBytes: BigInt(input.sizeBytes),
      uploadDurationSec: input.durationSec ?? null,
    },
  })

  return {
    id,
    uploadId,
    partSizeBytes: IMMERSIVE_VIDEO_PART_SIZE_BYTES,
    partCount: immersiveVideoPartCount(input.sizeBytes),
  }
}

export async function uploadImmersiveVideoPart(
  deps: ServiceDeps,
  input: { id: string; partNumber: number; part: File },
): Promise<{ partNumber: number }> {
  const row = await loadVideo(deps.prisma, input.id)
  if (!row.uploadId || !row.uploadObjectKey) {
    throw new ImmersiveVideoError('NO_UPLOAD')
  }
  const sizeBytes = toSizeBytesNumber(row.uploadSizeBytes) ?? 0
  const partCount = immersiveVideoPartCount(sizeBytes)
  if (input.partNumber < 1 || input.partNumber > partCount) {
    throw new ImmersiveVideoError('BAD_PART_NUMBER')
  }
  const expectedSize = expectedImmersiveVideoPartSize(
    sizeBytes,
    input.partNumber,
  )
  if (input.part.size !== expectedSize) {
    throw new ImmersiveVideoError('BAD_PART_SIZE')
  }

  const body = Buffer.from(await input.part.arrayBuffer())
  await deps.s3.uploadPart({
    key: row.uploadObjectKey,
    uploadId: row.uploadId,
    partNumber: input.partNumber,
    body,
    contentLength: input.part.size,
  })
  return { partNumber: input.partNumber }
}

export async function immersiveVideoUploadStatus(
  deps: ServiceDeps,
  id: string,
): Promise<{
  uploadedPartNumbers: number[]
  sizeBytes: number
  filename: string
}> {
  const row = await loadVideo(deps.prisma, id)
  if (!row.uploadId || !row.uploadObjectKey) {
    throw new ImmersiveVideoError('NO_UPLOAD')
  }
  const parts = await deps.s3.listParts({
    key: row.uploadObjectKey,
    uploadId: row.uploadId,
  })
  return {
    uploadedPartNumbers: parts
      .map((part) => part.partNumber)
      .sort((a, b) => a - b),
    sizeBytes: toSizeBytesNumber(row.uploadSizeBytes) ?? 0,
    filename: row.uploadFilename ?? '',
  }
}

/**
 * Completes the multipart upload and verifies inline. Verify is one
 * HeadObject, so the caller gets the settled row (Draft or Published, or the
 * failure notice) instead of a transient Verifying it would have to poll for.
 * The row still passes through Verifying so the sweep recovers a crash here.
 */
export async function completeImmersiveVideoUpload(
  deps: ServiceDeps,
  id: string,
): Promise<ImmersiveVideoAdminRow> {
  const row = await loadVideo(deps.prisma, id)
  if (!row.uploadId || !row.uploadObjectKey) {
    throw new ImmersiveVideoError('NO_UPLOAD')
  }
  const sizeBytes = toSizeBytesNumber(row.uploadSizeBytes) ?? 0
  const partCount = immersiveVideoPartCount(sizeBytes)
  const parts = await deps.s3.listParts({
    key: row.uploadObjectKey,
    uploadId: row.uploadId,
  })
  const present = new Set(parts.map((part) => part.partNumber))
  for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
    if (!present.has(partNumber)) {
      throw new ImmersiveVideoError('PARTS_MISSING')
    }
  }

  await deps.s3.completeMultipartUpload({
    key: row.uploadObjectKey,
    uploadId: row.uploadId,
    parts,
  })

  // The multipart upload no longer exists after Complete; drop the id so the
  // NO_UPLOAD guards stop routing status/abort/delete at a dead UploadId.
  await deps.prisma.immersiveVideo.update({
    where: { id },
    data: { state: 'Verifying', uploadId: null },
  })
  return runImmersiveVideoVerify(id, deps)
}

export async function abortImmersiveVideoUpload(
  deps: ServiceDeps,
  id: string,
): Promise<ImmersiveVideoAdminRow> {
  const row = await loadVideo(deps.prisma, id)
  if (!row.uploadId || !row.uploadObjectKey) {
    throw new ImmersiveVideoError('NO_UPLOAD')
  }
  await deps.s3.abortMultipartUpload({
    key: row.uploadObjectKey,
    uploadId: row.uploadId,
  })
  const priorState = row.priorState ?? 'Draft'
  const updated = await deps.prisma.immersiveVideo.update({
    where: { id },
    data: {
      state: priorState,
      priorState: null,
      ...UPLOAD_CLEAR,
    },
  })
  return toImmersiveVideoAdminRow(updated)
}

/**
 * Integrity is settled on ingest: S3 validated every part's SHA-256 as it
 * arrived and recorded the composite checksum at Complete. Verify only
 * confirms the object landed whole; nothing streams the bytes back.
 */
export async function runImmersiveVideoVerify(
  id: string,
  deps: ServiceDeps,
): Promise<ImmersiveVideoAdminRow> {
  const row = await loadVideo(deps.prisma, id)
  if (row.state !== 'Verifying' || !row.uploadObjectKey) {
    return toImmersiveVideoAdminRow(row)
  }

  const expectedBytes = toSizeBytesNumber(row.uploadSizeBytes)
  const restoreState: ImmersiveVideoCatalogState =
    row.priorState === 'Published' ? 'Published' : 'Draft'

  let head: { contentLength: number; checksumSha256: string | null } | null =
    null
  try {
    head = await deps.s3.headObject({ key: row.uploadObjectKey })
  } catch {
    head = null
  }

  const checksum =
    head != null &&
    head.checksumSha256 != null &&
    expectedBytes != null &&
    head.contentLength === expectedBytes
      ? head.checksumSha256
      : null

  if (checksum == null) {
    await deps.s3.deleteObject({ key: row.uploadObjectKey })
    // A republish uploads onto the live key, so a failed one has already
    // replaced the published bytes: the row loses its file instead of
    // returning to Published with an object it can no longer vouch for.
    const liveObjectLost = row.objectKey === row.uploadObjectKey
    const updated = await deps.prisma.immersiveVideo.update({
      where: { id },
      data: {
        state: liveObjectLost
          ? restoreState === 'Published'
            ? 'Unpublished'
            : restoreState
          : restoreState,
        priorState: null,
        verifyFailedAt: new Date(),
        ...(liveObjectLost ? FILE_CLEAR : {}),
        ...UPLOAD_CLEAR,
      },
    })
    return toImmersiveVideoAdminRow(updated)
  }

  const updated = await deps.prisma.immersiveVideo.update({
    where: { id },
    data: {
      objectKey: row.uploadObjectKey,
      sizeBytes: row.uploadSizeBytes,
      checksum,
      filename: row.uploadFilename,
      durationSec: row.uploadDurationSec,
      state: restoreState,
      priorState: null,
      ...UPLOAD_CLEAR,
    },
  })

  // A replace that changed the key (new bundle filename, or a different
  // extension) leaves the previous object behind.
  if (row.objectKey && row.objectKey !== row.uploadObjectKey) {
    await deps.s3.deleteObject({ key: row.objectKey })
  }

  return toImmersiveVideoAdminRow(updated)
}
