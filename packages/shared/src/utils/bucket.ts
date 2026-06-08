import { CDN_URL } from '../types/general.ts'

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

export type S3ListPrefixResult = {
  CommonPrefixes?: { Prefix?: string }[]
  Contents?: {
    Key?: string
    Size?: number
    LastModified?: Date
  }[]
  NextContinuationToken?: string | null
}

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
