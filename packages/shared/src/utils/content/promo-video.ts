import type {
  AssignPromoVideoInput,
  PromoVideoItem,
} from '../../types/promo-video.ts'
import { bucketCdnUrl, validateBucketObjectKey } from './bucket.ts'

export const DEFAULT_PROMO_VIDEO_OBJECT_KEY = 'virtality-promo-web-001.mp4'
export const PROMO_VIDEO_SINGLETON_ID = 'promo-video-singleton'

export type PromoVideoRecord = {
  id: string
  objectKey: string
  createdAt: Date
  updatedAt: Date
}

export type PromoVideoUpdateData = {
  objectKey: string
}

export type PromoVideoStore = {
  findSingleton: () => Promise<PromoVideoRecord | null>
  create: (data: { id: string; objectKey: string }) => Promise<PromoVideoRecord>
  update: (id: string, data: PromoVideoUpdateData) => Promise<PromoVideoRecord>
  deleteAll: () => Promise<void>
}

export type ClearPromoVideoOutcome = {
  cleared: boolean
  objectKey: string | null
}

export class PromoVideoValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PromoVideoValidationError'
  }
}

function isMp4ObjectKey(objectKey: string): boolean {
  return objectKey.toLowerCase().endsWith('.mp4')
}

function normalizePromoVideoObjectKey(objectKey: string): string {
  const trimmed = objectKey.trim()
  const objectKeyError = validateBucketObjectKey(trimmed)

  if (objectKeyError) {
    throw new PromoVideoValidationError(objectKeyError)
  }

  if (!isMp4ObjectKey(trimmed)) {
    throw new PromoVideoValidationError(
      'Promo video object key must end with .mp4.',
    )
  }

  return trimmed
}

export function mapPromoVideoToItem(record: PromoVideoRecord): PromoVideoItem {
  return {
    id: record.id,
    objectKey: record.objectKey,
    cdnUrl: bucketCdnUrl(record.objectKey),
  }
}

export async function getPromoVideo(
  store: PromoVideoStore,
): Promise<PromoVideoItem | null> {
  const record = await store.findSingleton()

  if (!record) {
    return null
  }

  return mapPromoVideoToItem(record)
}

export async function assignPromoVideo(
  store: PromoVideoStore,
  input: AssignPromoVideoInput,
): Promise<PromoVideoItem> {
  const objectKey = normalizePromoVideoObjectKey(input.objectKey)
  const existing = await store.findSingleton()

  if (existing) {
    const updated = await store.update(existing.id, { objectKey })
    return mapPromoVideoToItem(updated)
  }

  const created = await store.create({
    id: PROMO_VIDEO_SINGLETON_ID,
    objectKey,
  })

  return mapPromoVideoToItem(created)
}

export async function clearPromoVideo(
  store: PromoVideoStore,
): Promise<ClearPromoVideoOutcome> {
  const existing = await store.findSingleton()

  if (!existing) {
    return {
      cleared: false,
      objectKey: null,
    }
  }

  const { objectKey } = existing
  await store.deleteAll()

  return {
    cleared: true,
    objectKey,
  }
}
