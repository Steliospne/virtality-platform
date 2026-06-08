import { Buffer } from 'node:buffer'
import { CDN_URL } from '../types/general.ts'
import { createRandomStringGenerator } from './random.ts'

export type BucketFolderRow = {
  type: 'folder'
  name: string
  prefix: string
}

export type BucketObjectRow = {
  type: 'object'
  name: string
  objectKey: string
  cdnUrl: string
  contentType: string
  size: number
  lastModified: string | null
}

export type BucketListPage = {
  prefix: string
  folders: BucketFolderRow[]
  objects: BucketObjectRow[]
  nextContinuationToken: string | null
}

export type BucketUploadFileInput = {
  name: string
  contentType: string
  body: Buffer
}

export type BucketUploadResultItem = {
  filename: string
  objectKey: string
  cdnUrl: string
  contentType: string
  size: number
}

export type BucketUploadFailure = {
  filename: string
  error: string
}

export type BucketUploadOutcome = {
  uploads: BucketUploadResultItem[]
  failures: BucketUploadFailure[]
}

export type BucketUploadS3Client = {
  uploadFile: (input: {
    Key: string
    Body: Buffer
    ContentType?: string
  }) => Promise<unknown | null>
}

export type BucketMoveS3Client = {
  objectExists: (input: { Key: string }) => Promise<boolean>
  copyObject: (input: {
    sourceKey: string
    destinationKey: string
  }) => Promise<boolean>
  deleteFile: (input: { Key: string }) => Promise<unknown | null>
}

export type BucketMoveOutcome = {
  sourceObjectKey: string
  destinationObjectKey: string
  cdnUrl: string
}

export type BucketDeleteS3Client = {
  deleteFile: (input: { Key: string }) => Promise<unknown | null>
}

export type BucketDeleteOutcome = {
  objectKey: string
}

export type S3ListPrefixResult = {
  CommonPrefixes?: { Prefix?: string }[]
  Contents?: {
    Key?: string
    Size?: number
    LastModified?: Date
  }[]
  NextContinuationToken?: string | null
}

const UNSAFE_BUCKET_PATH_CHARS = /[?#\s%<>|\\:*"']/
const BUCKET_SEGMENT_PATTERN = /^[a-z0-9][a-z0-9_-]*$/i

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  pdf: 'application/pdf',
  json: 'application/json',
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
}

function getBucketPathSegments(path: string): string[] {
  const trimmed = path.trim().replace(/^\/+/, '').replace(/\/+$/, '')
  if (!trimmed) {
    return []
  }

  return trimmed.split('/')
}

export function validateBucketTargetPrefix(prefix: string): string | null {
  const trimmed = prefix.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith('/')) {
    return 'Bucket paths cannot start with a slash'
  }

  if (trimmed.includes('?')) {
    return 'Bucket paths cannot contain query strings'
  }

  if (UNSAFE_BUCKET_PATH_CHARS.test(trimmed)) {
    return 'Bucket paths contain invalid characters'
  }

  const segments = getBucketPathSegments(trimmed)
  for (const segment of segments) {
    if (!segment) {
      return 'Bucket paths cannot contain empty segments'
    }

    if (segment === '.' || segment === '..') {
      return 'Bucket paths cannot contain dot segments'
    }

    if (!BUCKET_SEGMENT_PATTERN.test(segment)) {
      return 'Bucket path segments must be URL-safe'
    }
  }

  return null
}

export function validateBucketObjectKey(objectKey: string): string | null {
  const trimmed = objectKey.trim()
  if (!trimmed) {
    return 'Object keys cannot be empty'
  }

  if (trimmed.startsWith('/')) {
    return 'Object keys cannot start with a slash'
  }

  if (trimmed.endsWith('/')) {
    return 'Object keys cannot end with a slash'
  }

  if (trimmed.includes('?')) {
    return 'Object keys cannot contain query strings'
  }

  if (UNSAFE_BUCKET_PATH_CHARS.test(trimmed)) {
    return 'Object keys contain invalid characters'
  }

  const segments = trimmed.split('/')
  for (const segment of segments) {
    if (!segment) {
      return 'Object keys cannot contain empty segments'
    }

    if (segment === '.' || segment === '..') {
      return 'Object keys cannot contain dot segments'
    }
  }

  const filename = segments.at(-1) ?? ''
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(filename)) {
    return 'Object key filenames must be URL-safe'
  }

  return null
}

export function sanitizeBucketFilenameStem(filename: string): string {
  const sanitized = filename
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return sanitized || 'file'
}

export function getBucketFilenameParts(filename: string): {
  stem: string
  extension: string
} {
  const trimmed = filename.trim()
  const lastDot = trimmed.lastIndexOf('.')
  if (lastDot <= 0 || lastDot === trimmed.length - 1) {
    return { stem: trimmed, extension: '' }
  }

  return {
    stem: trimmed.slice(0, lastDot),
    extension: trimmed.slice(lastDot + 1).toLowerCase(),
  }
}

export function buildBucketObjectKey({
  targetPrefix,
  originalFilename,
  uniqueSuffix,
}: {
  targetPrefix: string
  originalFilename: string
  uniqueSuffix: string
}): string {
  const prefixError = validateBucketTargetPrefix(targetPrefix)
  if (prefixError) {
    throw new Error(prefixError)
  }

  const normalizedPrefix = normalizeBucketPrefix(
    targetPrefix.trim().toLowerCase().replace(/^\/+/, '').replace(/\/+/g, '/'),
  )
  const { stem, extension } = getBucketFilenameParts(originalFilename)
  const sanitizedStem = sanitizeBucketFilenameStem(stem)
  const suffix = uniqueSuffix.toLowerCase()
  const filename = extension
    ? `${sanitizedStem}-${suffix}.${extension}`
    : `${sanitizedStem}-${suffix}`
  const objectKey = `${normalizedPrefix}${filename}`
  const objectKeyError = validateBucketObjectKey(objectKey)

  if (objectKeyError) {
    throw new Error(objectKeyError)
  }

  return objectKey
}

export async function uploadBucketObjects({
  s3,
  targetPrefix,
  files,
  createSuffix = () => createRandomStringGenerator('a-z', '0-9')(8),
}: {
  s3: BucketUploadS3Client
  targetPrefix: string
  files: BucketUploadFileInput[]
  createSuffix?: () => string
}): Promise<BucketUploadOutcome> {
  const prefixError = validateBucketTargetPrefix(targetPrefix)
  if (prefixError) {
    throw new Error(prefixError)
  }

  const uploads: BucketUploadResultItem[] = []
  const failures: BucketUploadFailure[] = []

  for (const file of files) {
    try {
      const objectKey = buildBucketObjectKey({
        targetPrefix,
        originalFilename: file.name,
        uniqueSuffix: createSuffix(),
      })
      const contentType =
        file.contentType || inferContentTypeFromObjectKey(objectKey)
      const result = await s3.uploadFile({
        Key: objectKey,
        Body: file.body,
        ContentType: contentType,
      })

      if (result === null) {
        failures.push({ filename: file.name, error: 'Upload failed' })
        continue
      }

      uploads.push({
        filename: file.name,
        objectKey,
        cdnUrl: bucketCdnUrl(objectKey),
        contentType,
        size: file.body.byteLength,
      })
    } catch (error) {
      failures.push({
        filename: file.name,
        error: error instanceof Error ? error.message : 'Upload failed',
      })
    }
  }

  return { uploads, failures }
}

export function normalizeBucketPrefix(prefix: string): string {
  const trimmed = prefix.trim().replace(/^\/+/, '').replace(/\/+/g, '/')
  if (!trimmed) {
    return ''
  }

  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
}

export function bucketCdnUrl(objectKey: string): string {
  return `${CDN_URL}/${objectKey}`
}

export function inferContentTypeFromObjectKey(objectKey: string): string {
  const extension = objectKey.split('.').pop()?.toLowerCase()
  if (!extension) {
    return 'application/octet-stream'
  }

  return EXTENSION_CONTENT_TYPES[extension] ?? 'application/octet-stream'
}

export function getFolderDisplayName(
  folderPrefix: string,
  parentPrefix: string,
): string {
  const relativePrefix = folderPrefix.startsWith(parentPrefix)
    ? folderPrefix.slice(parentPrefix.length)
    : folderPrefix

  return relativePrefix.replace(/\/$/, '')
}

export function getObjectDisplayName(
  objectKey: string,
  parentPrefix: string,
): string {
  const relativeKey = objectKey.startsWith(parentPrefix)
    ? objectKey.slice(parentPrefix.length)
    : objectKey

  return relativeKey
}

export function getBucketObjectParentPrefix(objectKey: string): string {
  const lastSlash = objectKey.lastIndexOf('/')
  if (lastSlash === -1) {
    return ''
  }

  return objectKey.slice(0, lastSlash + 1)
}

export function buildRenameDestinationObjectKey(
  sourceObjectKey: string,
  newFilename: string,
): string {
  const parentPrefix = getBucketObjectParentPrefix(sourceObjectKey)
  const destinationObjectKey = `${parentPrefix}${newFilename.trim()}`
  const destinationError = validateBucketObjectKey(destinationObjectKey)

  if (destinationError) {
    throw new Error(destinationError)
  }

  return destinationObjectKey
}

export async function deleteBucketObject({
  s3,
  objectKey,
}: {
  s3: BucketDeleteS3Client
  objectKey: string
}): Promise<BucketDeleteOutcome> {
  const trimmed = objectKey.trim()
  const keyError = validateBucketObjectKey(trimmed)

  if (keyError) {
    throw new Error(keyError)
  }

  const deleteResult = await s3.deleteFile({ Key: trimmed })
  if (deleteResult === null) {
    throw new Error('Failed to delete bucket object')
  }

  return { objectKey: trimmed }
}

export async function moveBucketObject({
  s3,
  sourceObjectKey,
  destinationObjectKey,
}: {
  s3: BucketMoveS3Client
  sourceObjectKey: string
  destinationObjectKey: string
}): Promise<BucketMoveOutcome> {
  const trimmedSource = sourceObjectKey.trim()
  const trimmedDestination = destinationObjectKey.trim()
  const destinationError = validateBucketObjectKey(trimmedDestination)

  if (destinationError) {
    throw new Error(destinationError)
  }

  if (trimmedSource === trimmedDestination) {
    throw new Error('Source and destination object keys are the same')
  }

  if (await s3.objectExists({ Key: trimmedDestination })) {
    throw new Error('Destination object key already exists')
  }

  const copySucceeded = await s3.copyObject({
    sourceKey: trimmedSource,
    destinationKey: trimmedDestination,
  })

  if (!copySucceeded) {
    throw new Error('Failed to copy bucket object')
  }

  const deleteResult = await s3.deleteFile({ Key: trimmedSource })
  if (deleteResult === null) {
    throw new Error('Copied bucket object but failed to delete the original')
  }

  return {
    sourceObjectKey: trimmedSource,
    destinationObjectKey: trimmedDestination,
    cdnUrl: bucketCdnUrl(trimmedDestination),
  }
}

export function getBucketBreadcrumbs(
  prefix: string,
): { label: string; prefix: string }[] {
  const normalizedPrefix = normalizeBucketPrefix(prefix)
  const breadcrumbs = [{ label: 'Bucket', prefix: '' }]

  if (!normalizedPrefix) {
    return breadcrumbs
  }

  const segments = normalizedPrefix.slice(0, -1).split('/').filter(Boolean)
  let currentPrefix = ''

  for (const segment of segments) {
    currentPrefix += `${segment}/`
    breadcrumbs.push({ label: segment, prefix: currentPrefix })
  }

  return breadcrumbs
}

export function formatBucketListPage(
  prefix: string,
  result: S3ListPrefixResult,
): BucketListPage {
  const normalizedPrefix = normalizeBucketPrefix(prefix)

  const folders = (result.CommonPrefixes ?? [])
    .map((entry) => entry.Prefix)
    .filter((folderPrefix): folderPrefix is string => Boolean(folderPrefix))
    .map((folderPrefix) => ({
      type: 'folder' as const,
      name: getFolderDisplayName(folderPrefix, normalizedPrefix),
      prefix: folderPrefix,
    }))
    .sort((left, right) => left.name.localeCompare(right.name))

  const objects = (result.Contents ?? [])
    .map((entry) => entry.Key)
    .filter((objectKey): objectKey is string => Boolean(objectKey))
    .filter((objectKey) => objectKey !== normalizedPrefix)
    .filter((objectKey) => !objectKey.endsWith('/'))
    .map((objectKey) => {
      const content = result.Contents?.find((entry) => entry.Key === objectKey)

      return {
        type: 'object' as const,
        name: getObjectDisplayName(objectKey, normalizedPrefix),
        objectKey,
        cdnUrl: bucketCdnUrl(objectKey),
        contentType: inferContentTypeFromObjectKey(objectKey),
        size: content?.Size ?? 0,
        lastModified: content?.LastModified?.toISOString() ?? null,
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name))

  return {
    prefix: normalizedPrefix,
    folders,
    objects,
    nextContinuationToken: result.NextContinuationToken ?? null,
  }
}
