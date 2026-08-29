import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'
import {
  bucketCdnUrl,
  buildBucketObjectKey,
  buildFolderDestinationObjectKey,
  buildFolderRenameDestinationPrefix,
  buildRenameDestinationObjectKey,
  collectObjectKeysUnderPrefix,
  deleteBucketObject,
  deleteFolderPrefix,
  formatBucketListPage,
  getBucketBreadcrumbs,
  getBucketObjectDetails,
  inferContentTypeFromObjectKey,
  moveBucketObject,
  moveFolderPrefix,
  replaceBucketObject,
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
  it('infers list row content type from extension without metadata lookup', () => {
    const page = formatBucketListPage('', {
      Contents: [
        {
          Key: 'assets/photo.jpg',
          Size: 100,
          LastModified: new Date('2026-01-01T00:00:00.000Z'),
        },
        {
          Key: 'data/archive',
          Size: 50,
          LastModified: new Date('2026-01-02T00:00:00.000Z'),
        },
      ],
    })

    expect(page.objects.map((object) => object.contentType)).toEqual([
      'image/jpeg',
      'application/octet-stream',
    ])
  })

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

describe('getBucketObjectDetails', () => {
  it('returns exact stored metadata from storage', async () => {
    const s3 = {
      headObject: vi.fn(async () => ({
        ContentType: 'image/webp',
        ContentLength: 2048,
        LastModified: new Date('2026-01-05T00:00:00.000Z'),
        ETag: '"abc123"',
      })),
    }

    const details = await getBucketObjectDetails({
      s3,
      objectKey: 'images/photo.jpg',
    })

    expect(details).toMatchObject({
      found: true,
      objectKey: 'images/photo.jpg',
      cdnUrl: 'https://cdn.virtality.app/images/photo.jpg',
      storedContentType: 'image/webp',
      inferredContentType: 'image/jpeg',
      size: 2048,
      lastModified: '2026-01-05T00:00:00.000Z',
      etag: '"abc123"',
    })
    expect(s3.headObject).toHaveBeenCalledTimes(1)
    expect(s3.headObject).toHaveBeenCalledWith({ Key: 'images/photo.jpg' })
  })

  it('handles missing or deleted objects without throwing', async () => {
    const s3 = {
      headObject: vi.fn(async () => null),
    }

    const details = await getBucketObjectDetails({
      s3,
      objectKey: 'images/missing.jpg',
    })

    expect(details).toMatchObject({
      found: false,
      objectKey: 'images/missing.jpg',
      cdnUrl: 'https://cdn.virtality.app/images/missing.jpg',
      storedContentType: null,
      inferredContentType: 'image/jpeg',
      size: null,
      lastModified: null,
      etag: null,
    })
  })

  it('rejects invalid object keys without calling storage', async () => {
    const s3 = {
      headObject: vi.fn(),
    }

    await expect(
      getBucketObjectDetails({
        s3,
        objectKey: 'images/photo.jpg/',
      }),
    ).rejects.toThrow(/slash/)

    expect(s3.headObject).not.toHaveBeenCalled()
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

describe('buildRenameDestinationObjectKey', () => {
  it('builds a destination key in the same folder as the source object', () => {
    expect(
      buildRenameDestinationObjectKey(
        'images/photo-abc123.jpg',
        'photo-renamed.jpg',
      ),
    ).toBe('images/photo-renamed.jpg')
  })

  it('rejects invalid rename filenames', () => {
    expect(() =>
      buildRenameDestinationObjectKey('images/photo.jpg', 'my photo.jpg'),
    ).toThrow(/invalid/)
  })
})

describe('deleteBucketObject', () => {
  it('rejects invalid object keys without calling storage', async () => {
    const s3 = {
      deleteFile: vi.fn(),
    }

    await expect(
      deleteBucketObject({
        s3,
        objectKey: 'images/photo.jpg/',
      }),
    ).rejects.toThrow(/slash/)

    expect(s3.deleteFile).not.toHaveBeenCalled()
  })

  it('permanently deletes a valid bucket object', async () => {
    const s3 = {
      deleteFile: vi.fn(async () => ({})),
    }

    const outcome = await deleteBucketObject({
      s3,
      objectKey: 'images/photo.jpg',
    })

    expect(outcome).toEqual({ objectKey: 'images/photo.jpg' })
    expect(s3.deleteFile).toHaveBeenCalledWith({ Key: 'images/photo.jpg' })
  })

  it('reports storage failures without claiming success', async () => {
    const s3 = {
      deleteFile: vi.fn(async () => null),
    }

    await expect(
      deleteBucketObject({
        s3,
        objectKey: 'images/photo.jpg',
      }),
    ).rejects.toThrow(/failed to delete/i)
  })
})

describe('replaceBucketObject', () => {
  it('uploads replacement content to a new unique key without overwriting the old key', async () => {
    const uploadedKeys: string[] = []
    const s3 = {
      uploadFile: vi.fn(async (input) => {
        uploadedKeys.push(input.Key)
        return {}
      }),
      deleteFile: vi.fn(),
    }

    const outcome = await replaceBucketObject({
      s3,
      sourceObjectKey: 'images/photo-abc123.jpg',
      file: {
        name: 'Updated Photo.JPG',
        contentType: 'image/jpeg',
        body: Buffer.from('new-bytes'),
      },
      createSuffix: () => 'newsuffix1',
    })

    expect(uploadedKeys).toEqual(['images/updated-photo-newsuffix1.jpg'])
    expect(uploadedKeys).not.toContain('images/photo-abc123.jpg')
    expect(outcome).toMatchObject({
      oldObjectKey: 'images/photo-abc123.jpg',
      newObjectKey: 'images/updated-photo-newsuffix1.jpg',
      newCdnUrl:
        'https://cdn.virtality.app/images/updated-photo-newsuffix1.jpg',
      contentType: 'image/jpeg',
      size: 9,
      oldObjectDeleted: false,
    })
    expect(s3.deleteFile).not.toHaveBeenCalled()
  })

  it('deletes the old object only after a successful replacement upload', async () => {
    const s3 = {
      uploadFile: vi.fn(async () => ({})),
      deleteFile: vi.fn(async () => ({})),
    }

    const outcome = await replaceBucketObject({
      s3,
      sourceObjectKey: 'images/photo-abc123.jpg',
      file: {
        name: 'updated.jpg',
        contentType: 'image/jpeg',
        body: Buffer.from('new'),
      },
      deleteOldObject: true,
      createSuffix: () => 'newsuffix',
    })

    expect(outcome.oldObjectDeleted).toBe(true)
    expect(s3.uploadFile).toHaveBeenCalledBefore(s3.deleteFile)
    expect(s3.deleteFile).toHaveBeenCalledWith({
      Key: 'images/photo-abc123.jpg',
    })
  })

  it('leaves the old object untouched when replacement upload fails', async () => {
    const s3 = {
      uploadFile: vi.fn(async () => null),
      deleteFile: vi.fn(),
    }

    await expect(
      replaceBucketObject({
        s3,
        sourceObjectKey: 'images/photo-abc123.jpg',
        file: {
          name: 'updated.jpg',
          contentType: 'image/jpeg',
          body: Buffer.from('new'),
        },
        deleteOldObject: true,
        createSuffix: () => 'newsuffix',
      }),
    ).rejects.toThrow(/upload failed/i)

    expect(s3.deleteFile).not.toHaveBeenCalled()
  })

  it('keeps the old object when cleanup is not requested', async () => {
    const s3 = {
      uploadFile: vi.fn(async () => ({})),
      deleteFile: vi.fn(),
    }

    await replaceBucketObject({
      s3,
      sourceObjectKey: 'images/photo-abc123.jpg',
      file: {
        name: 'updated.jpg',
        contentType: 'image/jpeg',
        body: Buffer.from('new'),
      },
      deleteOldObject: false,
      createSuffix: () => 'newsuffix',
    })

    expect(s3.deleteFile).not.toHaveBeenCalled()
  })
})

describe('collectObjectKeysUnderPrefix', () => {
  it('enumerates every object key under a prefix across pages', async () => {
    const s3 = {
      listAllUnderPrefix: vi.fn(async ({ continuationToken }) => {
        if (continuationToken) {
          return {
            objectKeys: ['images/thumbs/preview.jpg'],
            nextContinuationToken: null,
          }
        }

        return {
          objectKeys: ['images/', 'images/photo.jpg', 'images/thumbs/'],
          nextContinuationToken: 'page-2',
        }
      }),
    }

    const objectKeys = await collectObjectKeysUnderPrefix(s3, 'images/')

    expect(objectKeys).toEqual([
      'images/photo.jpg',
      'images/thumbs/preview.jpg',
    ])
    expect(s3.listAllUnderPrefix).toHaveBeenCalledTimes(2)
  })
})

describe('buildFolderDestinationObjectKey', () => {
  it('maps object keys from one folder prefix to another', () => {
    expect(
      buildFolderDestinationObjectKey(
        'images/old/',
        'videos/new/',
        'images/old/photo.jpg',
      ),
    ).toBe('videos/new/photo.jpg')
  })
})

describe('buildFolderRenameDestinationPrefix', () => {
  it('renames a folder within its parent prefix', () => {
    expect(
      buildFolderRenameDestinationPrefix('images/thumbs/', 'previews'),
    ).toBe('images/previews/')
  })
})

describe('moveFolderPrefix', () => {
  it('moves every object with copy-before-delete semantics and partial-failure summaries', async () => {
    const s3 = {
      listAllUnderPrefix: vi.fn(async () => ({
        objectKeys: ['images/old/one.jpg', 'images/old/two.jpg'],
        nextContinuationToken: null,
      })),
      objectExists: vi.fn(async ({ Key }) => Key === 'videos/new/two.jpg'),
      copyObject: vi.fn(async () => true),
      deleteFile: vi.fn(async () => ({})),
    }

    const outcome = await moveFolderPrefix({
      s3,
      sourcePrefix: 'images/old/',
      destinationPrefix: 'videos/new/',
    })

    expect(outcome).toMatchObject({
      sourcePrefix: 'images/old/',
      destinationPrefix: 'videos/new/',
      objectCount: 2,
    })
    expect(outcome.successes).toEqual([
      {
        objectKey: 'images/old/one.jpg',
        success: true,
        destinationObjectKey: 'videos/new/one.jpg',
      },
    ])
    expect(outcome.failures).toEqual([
      {
        objectKey: 'images/old/two.jpg',
        success: false,
        error: 'Destination object key already exists',
      },
    ])
    expect(s3.copyObject).toHaveBeenCalledWith({
      sourceKey: 'images/old/one.jpg',
      destinationKey: 'videos/new/one.jpg',
    })
    expect(s3.deleteFile).toHaveBeenCalledWith({ Key: 'images/old/one.jpg' })
    expect(s3.deleteFile).not.toHaveBeenCalledWith({
      Key: 'images/old/two.jpg',
    })
  })
})

describe('deleteFolderPrefix', () => {
  it('permanently deletes every object under a folder prefix', async () => {
    const deletedKeys: string[] = []
    const s3 = {
      listAllUnderPrefix: vi.fn(async () => ({
        objectKeys: ['archive/one.txt', 'archive/two.txt'],
        nextContinuationToken: null,
      })),
      deleteFile: vi.fn(async ({ Key }) => {
        deletedKeys.push(Key)
        return Key === 'archive/two.txt' ? null : {}
      }),
    }

    const outcome = await deleteFolderPrefix({
      s3,
      sourcePrefix: 'archive/',
    })

    expect(outcome.objectCount).toBe(2)
    expect(outcome.successes).toEqual([
      { objectKey: 'archive/one.txt', success: true },
    ])
    expect(outcome.failures).toEqual([
      {
        objectKey: 'archive/two.txt',
        success: false,
        error: 'Failed to delete bucket object',
      },
    ])
    expect(deletedKeys).toEqual(['archive/one.txt', 'archive/two.txt'])
  })
})

describe('moveBucketObject', () => {
  it('rejects invalid destination object keys', async () => {
    const s3 = {
      objectExists: vi.fn(),
      copyObject: vi.fn(),
      deleteFile: vi.fn(),
    }

    await expect(
      moveBucketObject({
        s3,
        sourceObjectKey: 'images/photo.jpg',
        destinationObjectKey: 'images/photo.jpg/',
      }),
    ).rejects.toThrow(/slash/)

    expect(s3.objectExists).not.toHaveBeenCalled()
    expect(s3.copyObject).not.toHaveBeenCalled()
    expect(s3.deleteFile).not.toHaveBeenCalled()
  })

  it('blocks moves when the destination object key already exists', async () => {
    const s3 = {
      objectExists: vi.fn(async () => true),
      copyObject: vi.fn(),
      deleteFile: vi.fn(),
    }

    await expect(
      moveBucketObject({
        s3,
        sourceObjectKey: 'images/photo.jpg',
        destinationObjectKey: 'images/photo-copy.jpg',
      }),
    ).rejects.toThrow(/already exists/)

    expect(s3.copyObject).not.toHaveBeenCalled()
    expect(s3.deleteFile).not.toHaveBeenCalled()
  })

  it('copies before deleting and leaves the source when copy fails', async () => {
    const s3 = {
      objectExists: vi.fn(async () => false),
      copyObject: vi.fn(async () => false),
      deleteFile: vi.fn(),
    }

    await expect(
      moveBucketObject({
        s3,
        sourceObjectKey: 'images/photo.jpg',
        destinationObjectKey: 'videos/photo.jpg',
      }),
    ).rejects.toThrow(/copy/)

    expect(s3.copyObject).toHaveBeenCalledWith({
      sourceKey: 'images/photo.jpg',
      destinationKey: 'videos/photo.jpg',
    })
    expect(s3.deleteFile).not.toHaveBeenCalled()
  })

  it('moves an object by copying then deleting the source', async () => {
    const s3 = {
      objectExists: vi.fn(async () => false),
      copyObject: vi.fn(async () => true),
      deleteFile: vi.fn(async () => ({})),
    }

    const outcome = await moveBucketObject({
      s3,
      sourceObjectKey: 'images/photo.jpg',
      destinationObjectKey: 'videos/photo.jpg',
    })

    expect(outcome).toEqual({
      sourceObjectKey: 'images/photo.jpg',
      destinationObjectKey: 'videos/photo.jpg',
      cdnUrl: 'https://cdn.virtality.app/videos/photo.jpg',
    })
    expect(s3.copyObject).toHaveBeenCalledBefore(s3.deleteFile)
    expect(s3.deleteFile).toHaveBeenCalledWith({ Key: 'images/photo.jpg' })
  })
})
