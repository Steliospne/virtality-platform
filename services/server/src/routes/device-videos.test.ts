import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type CatalogRow = {
  id: string
  state: string
  version: number
  objectKey: string | null
  sizeBytes: bigint | null
  checksum: string | null
  uploadObjectKey?: string | null
  uploadSizeBytes?: bigint | null
}

type Store = {
  devices: Array<{ deviceId: string; deletedAt: Date | null }>
  catalog: CatalogRow[]
}

const { store, prisma } = vi.hoisted(() => {
  const store: Store = {
    devices: [],
    catalog: [],
  }

  function deviceMatches(
    device: Store['devices'][number],
    where: Record<string, unknown>,
  ): boolean {
    if (
      typeof where.deviceId === 'string' &&
      device.deviceId !== where.deviceId
    ) {
      return false
    }
    if (Object.prototype.hasOwnProperty.call(where, 'deletedAt')) {
      if (where.deletedAt === null && device.deletedAt != null) {
        return false
      }
    }
    if (Array.isArray(where.AND)) {
      return where.AND.every((part) =>
        deviceMatches(device, part as Record<string, unknown>),
      )
    }
    return true
  }

  const prisma = {
    device: {
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) =>
          store.devices.find((device) => deviceMatches(device, where)) ?? null,
      ),
    },
    immersiveVideo: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return store.catalog.find((row) => row.id === where.id) ?? null
      }),
    },
  }

  return { store, prisma }
})

vi.mock('@virtality/db', () => ({ prisma }))

const { deviceVideoRoutes } = await import('./device-videos.ts')

const app = new Hono().route('/api/v1/device-videos', deviceVideoRoutes)

function resetStore() {
  store.devices = [{ deviceId: 'headset-1', deletedAt: null }]
  store.catalog = []
}

function catalogVideo(overrides: Partial<CatalogRow> = {}): CatalogRow {
  return {
    id: 'video-1',
    state: 'Published',
    version: 2,
    objectKey: 'immersive-videos/video-1.mp4',
    sizeBytes: 1_024n,
    checksum: 'abc123',
    uploadObjectKey: 'immersive-videos/video-1.bundle',
    uploadSizeBytes: 2_048n,
    ...overrides,
  }
}

describe('device-videos routes', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('GET returns the live Published download descriptor', async () => {
    store.catalog = [catalogVideo()]

    const response = await app.request(
      '/api/v1/device-videos/video-1?deviceId=headset-1',
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({
      videoId: 'video-1',
      version: 2,
      url: 'https://cdn.virtality.app/immersive-videos/video-1.mp4?v=2',
      sizeBytes: 1024,
    })
  })

  it('GET Republishing serves live version and size, never upload* or the checksum', async () => {
    store.catalog = [
      catalogVideo({
        state: 'Republishing',
        version: 2,
        objectKey: 'immersive-videos/video-1.mp4',
        sizeBytes: 1_024n,
        checksum: 'live-sum',
        uploadObjectKey: 'immersive-videos/video-1.bundle',
        uploadSizeBytes: 9_999n,
      }),
    ]

    const response = await app.request(
      '/api/v1/device-videos/video-1?deviceId=headset-1',
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      videoId: 'video-1',
      version: 2,
      url: 'https://cdn.virtality.app/immersive-videos/video-1.mp4?v=2',
      sizeBytes: 1024,
    })
    expect(JSON.stringify(body)).not.toContain('bundle')
    expect(JSON.stringify(body)).not.toContain('live-sum')
  })

  it.each(['Draft', 'Uploading', 'Verifying', 'Unpublished'] as const)(
    'GET returns VIDEO_UNAVAILABLE for %s',
    async (state) => {
      store.catalog = [catalogVideo({ state })]

      const response = await app.request(
        '/api/v1/device-videos/video-1?deviceId=headset-1',
      )

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({
        error: 'VIDEO_UNAVAILABLE',
        message: 'Video is not available.',
      })
    },
  )

  it('GET returns VIDEO_UNAVAILABLE for an unknown id', async () => {
    const response = await app.request(
      '/api/v1/device-videos/missing?deviceId=headset-1',
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ error: 'VIDEO_UNAVAILABLE' })
  })

  it('GET returns UNPAIRED for an unpaired headset', async () => {
    store.devices = []

    const response = await app.request(
      '/api/v1/device-videos/video-1?deviceId=headset-1',
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ error: 'UNPAIRED' })
  })

  it('GET returns UNPAIRED when the only Device is soft-deleted', async () => {
    store.devices = [
      {
        deviceId: 'headset-1',
        deletedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]
    store.catalog = [catalogVideo()]

    const response = await app.request(
      '/api/v1/device-videos/video-1?deviceId=headset-1',
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ error: 'UNPAIRED' })
  })

  it('GET unpaired wins over an unknown video', async () => {
    store.devices = []

    const response = await app.request(
      '/api/v1/device-videos/missing?deviceId=headset-1',
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ error: 'UNPAIRED' })
  })

  it('GET returns 400 when deviceId is missing', async () => {
    const response = await app.request('/api/v1/device-videos/video-1')

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'INVALID_REQUEST',
      message: 'Invalid download request.',
    })
  })
})
