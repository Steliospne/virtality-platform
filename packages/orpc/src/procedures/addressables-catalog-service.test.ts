import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'
import {
  listAddressablesCatalogReleases,
  uploadAddressablesCatalog,
  type AddressablesCatalogS3,
} from './addressables-catalog-service.ts'
import { immersiveVideoObjectKey } from './immersive-video-constants.ts'

function createS3(
  objects: { key: string; size: number; lastModified: string | null }[] = [],
): AddressablesCatalogS3 {
  return {
    listObjects: vi.fn(async () => objects),
    putObject: vi.fn(async () => undefined),
  }
}

describe('immersiveVideoObjectKey', () => {
  it('keeps the Unity filename for a bundle', () => {
    expect(
      immersiveVideoObjectKey('cyc_01', 'bundle', 'videos_cyc_01_ab12.bundle'),
    ).toBe('immersive-videos/videos_cyc_01_ab12.bundle')
  })

  it('renames a raw video to the Video ID', () => {
    expect(immersiveVideoObjectKey('cyc_01', 'mp4', 'Coast Ride.mp4')).toBe(
      'immersive-videos/cyc_01.mp4',
    )
  })
})

describe('uploadAddressablesCatalog', () => {
  it('writes the catalog before the hash and stores the hash uncacheable', async () => {
    const s3 = createS3()
    const calls: string[] = []
    vi.mocked(s3.putObject).mockImplementation(async ({ key }) => {
      calls.push(key)
    })

    const release = await uploadAddressablesCatalog(s3, {
      catalog: { filename: 'catalog_2026.09.14.bin', body: Buffer.from('c') },
      hash: { filename: 'catalog_2026.09.14.hash', body: Buffer.from('h') },
    })

    expect(calls).toEqual([
      'immersive-videos/catalog_2026.09.14.bin',
      'immersive-videos/catalog_2026.09.14.hash',
    ])
    expect(s3.putObject).toHaveBeenLastCalledWith({
      key: 'immersive-videos/catalog_2026.09.14.hash',
      body: Buffer.from('h'),
      contentType: 'text/plain',
      cacheControl: 'no-cache',
    })
    expect(release).toMatchObject({
      stem: 'catalog_2026.09.14',
      catalogKey: 'immersive-videos/catalog_2026.09.14.bin',
      hashKey: 'immersive-videos/catalog_2026.09.14.hash',
      live: true,
    })
  })

  it('rejects a pair whose stems differ', async () => {
    await expect(
      uploadAddressablesCatalog(createS3(), {
        catalog: { filename: 'catalog_a.bin', body: Buffer.from('c') },
        hash: { filename: 'catalog_b.hash', body: Buffer.from('h') },
      }),
    ).rejects.toThrow('CATALOG_PAIR_MISMATCH')
  })

  it('rejects filenames that are not a Unity catalog pair', async () => {
    await expect(
      uploadAddressablesCatalog(createS3(), {
        catalog: { filename: 'settings.json', body: Buffer.from('c') },
        hash: { filename: 'settings.hash', body: Buffer.from('h') },
      }),
    ).rejects.toThrow('INVALID_CATALOG_FILENAME')
  })

  it('rejects an empty file', async () => {
    await expect(
      uploadAddressablesCatalog(createS3(), {
        catalog: { filename: 'catalog_a.bin', body: Buffer.alloc(0) },
        hash: { filename: 'catalog_a.hash', body: Buffer.from('h') },
      }),
    ).rejects.toThrow('CATALOG_SIZE')
  })
})

describe('listAddressablesCatalogReleases', () => {
  it('pairs catalogs with their hash, newest hash first, and marks the newest live', async () => {
    const s3 = createS3([
      { key: 'immersive-videos/catalog_1.bin', size: 10, lastModified: null },
      {
        key: 'immersive-videos/catalog_1.hash',
        size: 32,
        lastModified: '2026-09-01T00:00:00.000Z',
      },
      { key: 'immersive-videos/catalog_2.bin', size: 12, lastModified: null },
      {
        key: 'immersive-videos/catalog_2.hash',
        size: 32,
        lastModified: '2026-09-14T00:00:00.000Z',
      },
      {
        key: 'immersive-videos/catalog_orphan.hash',
        size: 32,
        lastModified: null,
      },
      { key: 'immersive-videos/catalog_x.bundle', size: 1, lastModified: null },
    ])

    const releases = await listAddressablesCatalogReleases(s3)

    expect(releases.map((release) => [release.stem, release.live])).toEqual([
      ['catalog_2', true],
      ['catalog_1', false],
    ])
    expect(releases[0]).toMatchObject({
      catalogKey: 'immersive-videos/catalog_2.bin',
      catalogSizeBytes: 12,
      hashKey: 'immersive-videos/catalog_2.hash',
    })
  })
})
