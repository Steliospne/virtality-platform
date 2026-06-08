import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'
import {
  bucketCdnUrl,
  buildBucketObjectKey,
  formatBucketListPage,
  getBucketBreadcrumbs,
  inferContentTypeFromObjectKey,
  sanitizeBucketFilenameStem,
  uploadBucketObjects,
  validateBucketObjectKey,
  validateBucketTargetPrefix,
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

describe('validateBucketTargetPrefix', () => {
  it('accepts bucket root and nested prefixes', () => {
    expect(validateBucketTargetPrefix('')).toBeNull()
    expect(validateBucketTargetPrefix('images')).toBeNull()
    expect(validateBucketTargetPrefix('images/thumbs/')).toBeNull()
  })

  it('rejects unsafe bucket path shapes', () => {
    expect(validateBucketTargetPrefix('/images')).toMatch(/slash/)
    expect(validateBucketTargetPrefix('images//thumbs')).toMatch(/empty/)
    expect(validateBucketTargetPrefix('images/./thumbs')).toMatch(/dot/)
    expect(validateBucketTargetPrefix('images/foo?bar')).toMatch(/query/)
    expect(validateBucketTargetPrefix('images/my folder')).toMatch(/invalid/)
    expect(validateBucketTargetPrefix('images/my file')).toMatch(/invalid/)
  })
})

describe('validateBucketObjectKey', () => {
  it('rejects trailing slashes and unsafe object keys', () => {
    expect(validateBucketObjectKey('images/photo.jpg/')).toMatch(/slash/)
    expect(validateBucketObjectKey('images/photo?.jpg')).toMatch(/query/)
    expect(validateBucketObjectKey('images/my photo.jpg')).toMatch(/invalid/)
  })
})

describe('sanitizeBucketFilenameStem', () => {
  it('creates readable lowercase stems from original filenames', () => {
    expect(sanitizeBucketFilenameStem('Hero Banner')).toBe('hero-banner')
    expect(sanitizeBucketFilenameStem('My_Photo!!')).toBe('my_photo')
    expect(sanitizeBucketFilenameStem('---')).toBe('file')
  })
})

describe('buildBucketObjectKey', () => {
  it('builds readable unique keys with lowercase extensions', () => {
    expect(
      buildBucketObjectKey({
        targetPrefix: 'images',
        originalFilename: 'Hero Banner.JPG',
        uniqueSuffix: 'a1b2c3d4',
      }),
    ).toBe('images/hero-banner-a1b2c3d4.jpg')
  })

  it('rejects invalid target prefixes', () => {
    expect(() =>
      buildBucketObjectKey({
        targetPrefix: '/images',
        originalFilename: 'photo.jpg',
        uniqueSuffix: 'abc12345',
      }),
    ).toThrow(/slash/)
  })
})

describe('uploadBucketObjects', () => {
  it('uploads multiple files with generated keys through a fake S3 client', async () => {
    const uploaded: { Key: string; Body: Buffer; ContentType?: string }[] = []
    const s3 = {
      uploadFile: vi.fn(async (input) => {
        uploaded.push({
          Key: input.Key,
          Body: input.Body as Buffer,
          ContentType: input.ContentType,
        })
        return {}
      }),
    }

    const outcome = await uploadBucketObjects({
      s3,
      targetPrefix: 'videos',
      files: [
        {
          name: 'Clip One.MP4',
          contentType: 'video/mp4',
          body: Buffer.from('one'),
        },
        {
          name: 'Clip Two.MP4',
          contentType: 'video/mp4',
          body: Buffer.from('two'),
        },
      ],
      createSuffix: () => 'fixedsuffix',
    })

    expect(uploaded).toHaveLength(2)
    expect(uploaded[0]?.Key).toBe('videos/clip-one-fixedsuffix.mp4')
    expect(uploaded[1]?.Key).toBe('videos/clip-two-fixedsuffix.mp4')
    expect(outcome.uploads).toHaveLength(2)
    expect(outcome.uploads[0]).toMatchObject({
      objectKey: 'videos/clip-one-fixedsuffix.mp4',
      cdnUrl: 'https://cdn.virtality.app/videos/clip-one-fixedsuffix.mp4',
      size: 3,
    })
    expect(outcome.failures).toEqual([])
    expect(s3.uploadFile).toHaveBeenCalledTimes(2)
  })

  it('records per-file failures without aborting the batch', async () => {
    let uploadAttempt = 0
    const s3 = {
      uploadFile: vi.fn(async () => {
        uploadAttempt += 1
        if (uploadAttempt === 2) {
          return null
        }
        return {}
      }),
    }

    const outcome = await uploadBucketObjects({
      s3,
      targetPrefix: 'images',
      files: [
        {
          name: 'good.png',
          contentType: 'image/png',
          body: Buffer.from('ok'),
        },
        {
          name: 'bad.png',
          contentType: 'image/png',
          body: Buffer.from('bad'),
        },
      ],
      createSuffix: () => 'testsuffix',
    })

    expect(outcome.uploads).toHaveLength(1)
    expect(outcome.failures).toEqual([
      {
        filename: 'bad.png',
        error: 'Upload failed',
      },
    ])
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
