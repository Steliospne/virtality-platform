import { describe, expect, it, vi } from 'vitest'
import {
  assignPromoVideo,
  clearPromoVideo,
  getPromoVideo,
  PROMO_VIDEO_SINGLETON_ID,
  PromoVideoValidationError,
  type PromoVideoRecord,
  type PromoVideoStore,
  type PromoVideoUpdateData,
} from './promo-video.ts'

const now = new Date('2026-07-20T12:00:00.000Z')

function createStore(
  initialRecords: PromoVideoRecord[] = [],
): PromoVideoStore & { records: PromoVideoRecord[] } {
  const records = [...initialRecords]

  return {
    records,
    findSingleton: vi.fn(async () => records[0] ?? null),
    create: vi.fn(async (data: { id: string; objectKey: string }) => {
      const record: PromoVideoRecord = {
        ...data,
        createdAt: now,
        updatedAt: now,
      }
      records.push(record)
      return record
    }),
    update: vi.fn(async (id: string, data: PromoVideoUpdateData) => {
      const record = records.find((entry) => entry.id === id)
      if (!record) {
        throw new Error(`Record ${id} not found`)
      }

      Object.assign(record, data, { updatedAt: now })
      return record
    }),
    deleteAll: vi.fn(async () => {
      records.splice(0, records.length)
    }),
  }
}

describe('promo video domain', () => {
  it('returns null when no promo video is assigned', async () => {
    const store = createStore()

    await expect(getPromoVideo(store)).resolves.toBeNull()
  })

  it('assigns an mp4 bucket object and returns a cdnUrl', async () => {
    const store = createStore()

    const item = await assignPromoVideo(store, {
      objectKey: 'marketing/videos/demo.mp4',
    })

    expect(item).toEqual({
      id: PROMO_VIDEO_SINGLETON_ID,
      objectKey: 'marketing/videos/demo.mp4',
      cdnUrl: 'https://cdn.virtality.app/marketing/videos/demo.mp4',
    })
    expect(store.records).toHaveLength(1)
  })

  it('rejects non-mp4 object keys', async () => {
    const store = createStore()

    await expect(
      assignPromoVideo(store, {
        objectKey: 'marketing/videos/demo.webm',
      }),
    ).rejects.toBeInstanceOf(PromoVideoValidationError)
  })

  it('replaces the existing assignment in place', async () => {
    const store = createStore([
      {
        id: PROMO_VIDEO_SINGLETON_ID,
        objectKey: 'virtality-promo-web-001.mp4',
        createdAt: now,
        updatedAt: now,
      },
    ])

    const item = await assignPromoVideo(store, {
      objectKey: 'marketing/videos/replacement.mp4',
    })

    expect(item).toEqual({
      id: PROMO_VIDEO_SINGLETON_ID,
      objectKey: 'marketing/videos/replacement.mp4',
      cdnUrl: 'https://cdn.virtality.app/marketing/videos/replacement.mp4',
    })
    expect(store.records).toHaveLength(1)
    expect(store.create).not.toHaveBeenCalled()
  })

  it('clears the assignment without deleting bucket storage', async () => {
    const store = createStore([
      {
        id: PROMO_VIDEO_SINGLETON_ID,
        objectKey: 'virtality-promo-web-001.mp4',
        createdAt: now,
        updatedAt: now,
      },
    ])

    const outcome = await clearPromoVideo(store)

    expect(outcome).toEqual({
      cleared: true,
      objectKey: 'virtality-promo-web-001.mp4',
    })
    expect(store.records).toHaveLength(0)
    await expect(getPromoVideo(store)).resolves.toBeNull()
  })
})
