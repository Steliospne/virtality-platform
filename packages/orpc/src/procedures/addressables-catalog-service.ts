import {
  ADDRESSABLES_CATALOG_HASH_CACHE_CONTROL,
  ADDRESSABLES_CATALOG_MAX_BYTES,
  addressablesCatalogObjectKey,
  addressablesCatalogStem,
  IMMERSIVE_VIDEO_OBJECT_PREFIX,
  ImmersiveVideoError,
  isAddressablesCatalogFilename,
  isAddressablesCatalogHashFilename,
} from './immersive-video-constants.ts'
import type { ImmersiveVideoS3 } from './immersive-video-s3.ts'

/**
 * One Addressables catalog release as the CDN holds it: the pair Unity wrote
 * next to the bundles. `live` marks the newest `.hash`, which is the pointer
 * headsets poll; older pairs are left behind and are harmless.
 */
export type AddressablesCatalogRelease = {
  stem: string
  catalogKey: string
  catalogSizeBytes: number
  hashKey: string | null
  lastModified: string | null
  live: boolean
}

const CATALOG_KEY_PREFIX = `${IMMERSIVE_VIDEO_OBJECT_PREFIX}/catalog_`

export type AddressablesCatalogS3 = Pick<
  ImmersiveVideoS3,
  'listObjects' | 'putObject'
>

export async function listAddressablesCatalogReleases(
  s3: AddressablesCatalogS3,
): Promise<AddressablesCatalogRelease[]> {
  const objects = await s3.listObjects({ prefix: CATALOG_KEY_PREFIX })
  const byStem = new Map<string, AddressablesCatalogRelease>()

  for (const object of objects) {
    const filename = object.key.slice(IMMERSIVE_VIDEO_OBJECT_PREFIX.length + 1)
    const stem = addressablesCatalogStem(filename)
    if (!stem) {
      continue
    }
    const release = byStem.get(stem) ?? {
      stem,
      catalogKey: '',
      catalogSizeBytes: 0,
      hashKey: null,
      lastModified: null,
      live: false,
    }
    if (isAddressablesCatalogFilename(filename)) {
      release.catalogKey = object.key
      release.catalogSizeBytes = object.size
    } else if (isAddressablesCatalogHashFilename(filename)) {
      release.hashKey = object.key
      release.lastModified = object.lastModified
    } else {
      continue
    }
    byStem.set(stem, release)
  }

  const releases = [...byStem.values()]
    .filter((release) => release.catalogKey !== '')
    .sort((a, b) => (b.lastModified ?? '').localeCompare(a.lastModified ?? ''))

  const newest = releases.find((release) => release.hashKey != null)
  if (newest) {
    newest.live = true
  }
  return releases
}

export type AddressablesCatalogUploadInput = {
  catalog: { filename: string; body: Buffer }
  hash: { filename: string; body: Buffer }
}

/**
 * Writes the catalog first and the `.hash` last: the hash is what flips
 * headsets onto the new catalog, so it must never point at a file that is
 * not there yet. The hash is stored uncacheable; the catalog's name is
 * unique per build, so default caching is correct for it.
 */
export async function uploadAddressablesCatalog(
  s3: AddressablesCatalogS3,
  input: AddressablesCatalogUploadInput,
): Promise<AddressablesCatalogRelease> {
  const catalogName = input.catalog.filename.trim()
  const hashName = input.hash.filename.trim()

  if (!isAddressablesCatalogFilename(catalogName)) {
    throw new ImmersiveVideoError('INVALID_CATALOG_FILENAME')
  }
  if (!isAddressablesCatalogHashFilename(hashName)) {
    throw new ImmersiveVideoError('INVALID_CATALOG_HASH_FILENAME')
  }
  const stem = addressablesCatalogStem(catalogName)
  if (stem == null || stem !== addressablesCatalogStem(hashName)) {
    throw new ImmersiveVideoError('CATALOG_PAIR_MISMATCH')
  }
  if (
    input.catalog.body.byteLength === 0 ||
    input.catalog.body.byteLength > ADDRESSABLES_CATALOG_MAX_BYTES ||
    input.hash.body.byteLength === 0 ||
    input.hash.body.byteLength > ADDRESSABLES_CATALOG_MAX_BYTES
  ) {
    throw new ImmersiveVideoError('CATALOG_SIZE')
  }

  const catalogKey = addressablesCatalogObjectKey(catalogName)
  const hashKey = addressablesCatalogObjectKey(hashName)

  await s3.putObject({
    key: catalogKey,
    body: input.catalog.body,
    contentType: catalogName.endsWith('.json')
      ? 'application/json'
      : 'application/octet-stream',
  })
  await s3.putObject({
    key: hashKey,
    body: input.hash.body,
    contentType: 'text/plain',
    cacheControl: ADDRESSABLES_CATALOG_HASH_CACHE_CONTROL,
  })

  return {
    stem,
    catalogKey,
    catalogSizeBytes: input.catalog.body.byteLength,
    hashKey,
    lastModified: new Date().toISOString(),
    live: true,
  }
}
