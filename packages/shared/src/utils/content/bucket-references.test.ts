import { describe, expect, it } from 'vitest'
import {
  buildBucketReferenceLookupValues,
  findKnownBucketFolderReferences,
  findKnownBucketObjectReferences,
  type BucketReferenceReader,
} from './bucket-references.ts'
import {
  deleteBucketObject,
  moveBucketObject,
  replaceBucketObject,
} from './bucket.ts'

function createReader(
  overrides: Partial<BucketReferenceReader> = {},
): BucketReferenceReader {
  return {
    findExerciseReferences: async () => [],
    findAvatarReferences: async () => [],
    findMapReferences: async () => [],
    findPatientReferences: async () => [],
    findUserReferences: async () => [],
    findPartnerLogoReferences: async () => [],
    findPromoVideoReferences: async () => [],
    findMosaicTileReferences: async () => [],
    ...overrides,
  }
}

describe('buildBucketReferenceLookupValues', () => {
  it('includes both object key and CDN URL lookup values', () => {
    expect(buildBucketReferenceLookupValues('images/photo-abc123.jpg')).toEqual(
      [
        'images/photo-abc123.jpg',
        'https://cdn.virtality.app/images/photo-abc123.jpg',
      ],
    )
  })
})

describe('findKnownBucketObjectReferences', () => {
  it('returns no references for unreferenced bucket objects', async () => {
    const outcome = await findKnownBucketObjectReferences({
      reader: createReader(),
      objectKey: 'images/unreferenced.jpg',
    })

    expect(outcome.references).toEqual([])
  })

  it('detects known database references by object key', async () => {
    const outcome = await findKnownBucketObjectReferences({
      reader: createReader({
        findExerciseReferences: async () => [
          {
            id: 'ex-1',
            displayName: 'Shoulder Flexion',
            image: 'images/photo-abc123.jpg',
            video: null,
          },
        ],
      }),
      objectKey: 'images/photo-abc123.jpg',
    })

    expect(outcome.references).toEqual([
      {
        resourceType: 'exercise',
        resourceId: 'ex-1',
        resourceLabel: 'Shoulder Flexion',
        field: 'image',
      },
    ])
  })

  it('detects known database references by stored CDN URL', async () => {
    const outcome = await findKnownBucketObjectReferences({
      reader: createReader({
        findUserReferences: async () => [
          {
            id: 'user-1',
            name: 'Alex Admin',
            image: 'https://cdn.virtality.app/avatars/user-1.png',
          },
        ],
      }),
      objectKey: 'avatars/user-1.png',
    })

    expect(outcome.references).toEqual([
      {
        resourceType: 'user',
        resourceId: 'user-1',
        resourceLabel: 'Alex Admin',
        field: 'image',
      },
    ])
  })

  it('reports exercise video references separately from image references', async () => {
    const outcome = await findKnownBucketObjectReferences({
      reader: createReader({
        findExerciseReferences: async () => [
          {
            id: 'ex-2',
            displayName: 'Squat Demo',
            image: 'images/squat.jpg',
            video: 'videos/squat-demo.mp4',
          },
        ],
      }),
      objectKey: 'videos/squat-demo.mp4',
    })

    expect(outcome.references).toEqual([
      {
        resourceType: 'exercise',
        resourceId: 'ex-2',
        resourceLabel: 'Squat Demo',
        field: 'video',
      },
    ])
  })

  it('detects mosaic tile references by object key', async () => {
    const outcome = await findKnownBucketObjectReferences({
      reader: createReader({
        findMosaicTileReferences: async () => [
          {
            id: 'tile-1',
            alt: 'Clinic session',
            image: 'marketing/mosaic/clinic.jpg',
            mediaKind: 'image',
          },
        ],
      }),
      objectKey: 'marketing/mosaic/clinic.jpg',
    })

    expect(outcome.references).toEqual([
      {
        resourceType: 'mosaic',
        resourceId: 'tile-1',
        resourceLabel: 'Clinic session',
        field: 'image',
      },
    ])
  })

  it('detects mosaic tile video references separately from image references', async () => {
    const outcome = await findKnownBucketObjectReferences({
      reader: createReader({
        findMosaicTileReferences: async () => [
          {
            id: 'tile-2',
            alt: 'Ambient demo',
            image: 'marketing/mosaic/demo.mp4',
            mediaKind: 'video',
          },
        ],
      }),
      objectKey: 'marketing/mosaic/demo.mp4',
    })

    expect(outcome.references).toEqual([
      {
        resourceType: 'mosaic',
        resourceId: 'tile-2',
        resourceLabel: 'Ambient demo',
        field: 'video',
      },
    ])
  })

  it('detects partner logo references by object key', async () => {
    const outcome = await findKnownBucketObjectReferences({
      reader: createReader({
        findPartnerLogoReferences: async () => [
          {
            id: 'logo-1',
            alt: 'NHS Trust',
            image: 'marketing/logos/nhs-trust.png',
          },
        ],
      }),
      objectKey: 'marketing/logos/nhs-trust.png',
    })

    expect(outcome.references).toEqual([
      {
        resourceType: 'partnerLogo',
        resourceId: 'logo-1',
        resourceLabel: 'NHS Trust',
        field: 'image',
      },
    ])
  })

  it('detects promo video references by object key', async () => {
    const outcome = await findKnownBucketObjectReferences({
      reader: createReader({
        findPromoVideoReferences: async () => [
          {
            id: 'promo-1',
            label: 'Landing promo video',
            video: 'virtality-promo-web-001.mp4',
          },
        ],
      }),
      objectKey: 'virtality-promo-web-001.mp4',
    })

    expect(outcome.references).toEqual([
      {
        resourceType: 'promoVideo',
        resourceId: 'promo-1',
        resourceLabel: 'Landing promo video',
        field: 'video',
      },
    ])
  })

  it('sorts references by resource type and label', async () => {
    const outcome = await findKnownBucketObjectReferences({
      reader: createReader({
        findAvatarReferences: async () => [
          {
            id: 'avatar-2',
            name: 'Zeta',
            image: 'shared/asset.png',
          },
        ],
        findMapReferences: async () => [
          {
            id: 'map-1',
            name: 'Clinic',
            image: 'shared/asset.png',
          },
        ],
      }),
      objectKey: 'shared/asset.png',
    })

    expect(
      outcome.references.map((reference) => reference.resourceType),
    ).toEqual(['avatar', 'map'])
  })
})

describe('bucket mutation invariants', () => {
  it('does not mutate domain records during delete operations', async () => {
    const s3 = {
      deleteFile: async () => ({}),
    }

    await deleteBucketObject({
      s3,
      objectKey: 'images/referenced.jpg',
    })

    expect(Object.keys(s3)).toEqual(['deleteFile'])
  })

  it('does not mutate domain records during move operations', async () => {
    const s3 = {
      objectExists: async () => false,
      copyObject: async () => true,
      deleteFile: async () => ({}),
    }

    await moveBucketObject({
      s3,
      sourceObjectKey: 'images/referenced.jpg',
      destinationObjectKey: 'archive/referenced.jpg',
    })

    expect(Object.keys(s3).sort()).toEqual([
      'copyObject',
      'deleteFile',
      'objectExists',
    ])
  })

  it('does not mutate domain records during replacement operations', async () => {
    const s3 = {
      uploadFile: async () => ({}),
      deleteFile: async () => ({}),
    }

    await replaceBucketObject({
      s3,
      sourceObjectKey: 'images/referenced.jpg',
      file: {
        name: 'updated.jpg',
        contentType: 'image/jpeg',
        body: Buffer.from('new'),
      },
      deleteOldObject: true,
      createSuffix: () => 'newsuffix',
    })

    expect(Object.keys(s3).sort()).toEqual(['deleteFile', 'uploadFile'])
  })
})

describe('findKnownBucketFolderReferences', () => {
  it('returns only folder objects with known references', async () => {
    const referencedObjects = await findKnownBucketFolderReferences({
      reader: createReader({
        findExerciseReferences: async (lookupValues) =>
          lookupValues.includes('images/folder/referenced.jpg')
            ? [
                {
                  id: 'exercise-1',
                  displayName: 'Shoulder Press',
                  image: 'images/folder/referenced.jpg',
                  video: null,
                },
              ]
            : [],
      }),
      objectKeys: [
        'images/folder/referenced.jpg',
        'images/folder/unreferenced.jpg',
      ],
    })

    expect(referencedObjects).toEqual([
      {
        objectKey: 'images/folder/referenced.jpg',
        references: [
          {
            resourceType: 'exercise',
            resourceId: 'exercise-1',
            resourceLabel: 'Shoulder Press',
            field: 'image',
          },
        ],
      },
    ])
  })
})
