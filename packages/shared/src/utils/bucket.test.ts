import { describe, expect, it } from 'vitest'
import {
  bucketCdnUrl,
  formatBucketListPage,
  getBucketBreadcrumbs,
  inferContentTypeFromObjectKey,
} from './bucket.ts'

describe('bucketCdnUrl', () => {
  it('builds the public CDN URL from an object key', () => {
    expect(bucketCdnUrl('images/photo-abc123.jpg')).toBe(
      'https://cdn.virtality.app/images/photo-abc123.jpg',
    )
  })
})

describe('inferContentTypeFromObjectKey', () => {
  it('infers common media and document types from extensions', () => {
    expect(inferContentTypeFromObjectKey('assets/logo.PNG')).toBe('image/png')
    expect(inferContentTypeFromObjectKey('clips/demo.MP4')).toBe('video/mp4')
    expect(inferContentTypeFromObjectKey('docs/guide.pdf')).toBe(
      'application/pdf',
    )
    expect(inferContentTypeFromObjectKey('data/archive')).toBe(
      'application/octet-stream',
    )
  })
})

describe('formatBucketListPage', () => {
  it('returns folders before objects in separate sorted lists', () => {
    const page = formatBucketListPage('', {
      CommonPrefixes: [{ Prefix: 'videos/' }, { Prefix: 'images/' }],
      Contents: [
        {
          Key: 'readme.txt',
          Size: 12,
          LastModified: new Date('2026-01-02T00:00:00.000Z'),
        },
        {
          Key: 'notes.md',
          Size: 8,
          LastModified: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      NextContinuationToken: 'token-2',
    })

    expect(page.prefix).toBe('')
    expect(page.folders.map((folder) => folder.name)).toEqual([
      'images',
      'videos',
    ])
    expect(page.objects.map((object) => object.name)).toEqual([
      'notes.md',
      'readme.txt',
    ])
    expect(page.objects[1]).toMatchObject({
      objectKey: 'readme.txt',
      cdnUrl: 'https://cdn.virtality.app/readme.txt',
      contentType: 'text/plain',
      size: 12,
      lastModified: '2026-01-02T00:00:00.000Z',
    })
    expect(page.nextContinuationToken).toBe('token-2')
  })

  it('scopes folder and object names to the current prefix', () => {
    const page = formatBucketListPage('images/', {
      CommonPrefixes: [{ Prefix: 'images/thumbs/' }],
      Contents: [
        {
          Key: 'images/photo.jpg',
          Size: 100,
          LastModified: new Date('2026-01-03T00:00:00.000Z'),
        },
      ],
    })

    expect(page.folders).toEqual([
      {
        type: 'folder',
        name: 'thumbs',
        prefix: 'images/thumbs/',
      },
    ])
    expect(page.objects).toEqual([
      expect.objectContaining({
        type: 'object',
        name: 'photo.jpg',
        objectKey: 'images/photo.jpg',
      }),
    ])
  })

  it('ignores prefix placeholder objects and trailing-slash folder markers', () => {
    const page = formatBucketListPage('images/', {
      Contents: [
        { Key: 'images/' },
        { Key: 'images/thumbs/' },
        {
          Key: 'images/photo.jpg',
          Size: 1,
          LastModified: new Date('2026-01-03T00:00:00.000Z'),
        },
      ],
    })

    expect(page.objects).toHaveLength(1)
    expect(page.objects[0]?.name).toBe('photo.jpg')
  })
})

describe('getBucketBreadcrumbs', () => {
  it('builds prefix breadcrumbs from the bucket root', () => {
    expect(getBucketBreadcrumbs('')).toEqual([{ label: 'Bucket', prefix: '' }])
    expect(getBucketBreadcrumbs('images/thumbs/')).toEqual([
      { label: 'Bucket', prefix: '' },
      { label: 'images', prefix: 'images/' },
      { label: 'thumbs', prefix: 'images/thumbs/' },
    ])
  })
})
