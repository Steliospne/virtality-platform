export function buildBucketObjectPreviewHref(objectKey: string): string {
  const encodedSegments = objectKey.split('/').map(encodeURIComponent)
  return `/bucket/object/${encodedSegments.join('/')}`
}
