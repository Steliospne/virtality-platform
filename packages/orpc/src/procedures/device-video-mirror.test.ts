import { describe, expect, it, vi } from 'vitest'
import {
  applyDeviceVideoEvent,
  removeDeviceVideo,
  replaceDeviceVideoLibraryState,
  requestDeviceVideoDownload,
  type MirrorPrisma,
} from './device-video-mirror.ts'

type ReportRow = {
  deviceId: string
  freeBytes: bigint | null
  reportedAt: Date
}
type VideoRow = {
  deviceId: string
  videoId: string
  status: string
  version: number | null
  bytesDownloaded: bigint | null
  sizeBytes: bigint | null
  reason: string | null
}

function createPrisma() {
  const reports = new Map<string, ReportRow>()
  let videos: VideoRow[] = []

  const prisma: MirrorPrisma = {
    deviceVideoReport: {
      upsert: vi.fn(async ({ where, create, update }) => {
        const existing = reports.get(where.deviceId)
        reports.set(
          where.deviceId,
          existing ? { ...existing, ...update } : create,
        )
      }),
    },
    deviceVideo: {
      deleteMany: vi.fn(async ({ where }) => {
        videos = videos.filter(
          (row) =>
            row.deviceId !== where.deviceId ||
            (where.videoId != null && row.videoId !== where.videoId) ||
            (where.status != null && row.status === where.status.not),
        )
      }),
      upsert: vi.fn(async ({ where, create, update }) => {
        const key = where.deviceId_videoId
        const index = videos.findIndex(
          (row) => row.deviceId === key.deviceId && row.videoId === key.videoId,
        )
        if (index === -1) {
          videos.push(create)
        } else {
          videos[index] = { ...videos[index]!, ...update }
        }
      }),
    },
    $transaction: async (fn) => fn(prisma),
  }

  return {
    prisma,
    reports,
    videos: () => videos,
    seed: (rows: VideoRow[]) => {
      videos = rows
    },
  }
}

function row(
  overrides: Partial<VideoRow> & Pick<VideoRow, 'videoId' | 'status'>,
): VideoRow {
  return {
    deviceId: 'headset-1',
    version: null,
    bytesDownloaded: null,
    sizeBytes: null,
    reason: null,
    ...overrides,
  }
}

describe('requestDeviceVideoDownload', () => {
  it('creates the report header without free space and a requested row', async () => {
    const db = createPrisma()

    await requestDeviceVideoDownload(db.prisma, {
      deviceId: 'headset-1',
      videoId: 'cyc_01',
    })

    expect(db.reports.get('headset-1')?.freeBytes).toBeNull()
    expect(db.videos()).toEqual([
      row({ videoId: 'cyc_01', status: 'requested' }),
    ])
  })
})

describe('replaceDeviceVideoLibraryState', () => {
  it('replaces reported rows and keeps unmentioned requested rows', async () => {
    const db = createPrisma()
    db.seed([
      row({ videoId: 'old', status: 'ready', version: 1 }),
      row({ videoId: 'pending', status: 'requested' }),
      row({ videoId: 'was-requested', status: 'requested' }),
    ])

    await replaceDeviceVideoLibraryState(db.prisma, {
      deviceId: 'headset-1',
      freeBytes: 42,
      videos: [
        { videoId: 'new', status: 'ready', version: 2, sizeBytes: 10 },
        { videoId: 'was-requested', status: 'downloading', bytesDownloaded: 5 },
      ],
    })

    expect(db.reports.get('headset-1')?.freeBytes).toBe(42n)
    expect(db.videos()).toHaveLength(3)
    expect(db.videos()).toEqual(
      expect.arrayContaining([
        row({ videoId: 'pending', status: 'requested' }),
        row({ videoId: 'new', status: 'ready', version: 2, sizeBytes: 10n }),
        row({
          videoId: 'was-requested',
          status: 'downloading',
          bytesDownloaded: 5n,
        }),
      ]),
    )
  })

  it('an empty report clears everything but requested rows', async () => {
    const db = createPrisma()
    db.seed([
      row({ videoId: 'gone', status: 'ready' }),
      row({ videoId: 'pending', status: 'requested' }),
    ])

    await replaceDeviceVideoLibraryState(db.prisma, {
      deviceId: 'headset-1',
      freeBytes: 0,
      videos: [],
    })

    expect(db.videos()).toEqual([
      row({ videoId: 'pending', status: 'requested' }),
    ])
  })
})

describe('applyDeviceVideoEvent', () => {
  it('patches one row and leaves the report free space alone', async () => {
    const db = createPrisma()
    db.reports.set('headset-1', {
      deviceId: 'headset-1',
      freeBytes: 7n,
      reportedAt: new Date(0),
    })
    db.seed([row({ videoId: 'cyc_01', status: 'requested' })])

    await applyDeviceVideoEvent(db.prisma, {
      deviceId: 'headset-1',
      videoId: 'cyc_01',
      status: 'downloading',
      bytesDownloaded: 3,
      sizeBytes: 9,
    })

    expect(db.reports.get('headset-1')?.freeBytes).toBe(7n)
    expect(db.reports.get('headset-1')?.reportedAt.getTime()).toBeGreaterThan(0)
    expect(db.videos()).toEqual([
      row({
        videoId: 'cyc_01',
        status: 'downloading',
        bytesDownloaded: 3n,
        sizeBytes: 9n,
      }),
    ])
  })

  it('a cancelled failure removes the row', async () => {
    const db = createPrisma()
    db.seed([
      row({ videoId: 'cyc_01', status: 'downloading' }),
      row({ videoId: 'other', status: 'ready' }),
    ])

    await applyDeviceVideoEvent(db.prisma, {
      deviceId: 'headset-1',
      videoId: 'cyc_01',
      status: 'failed',
      reason: 'cancelled',
    })

    expect(db.videos()).toEqual([row({ videoId: 'other', status: 'ready' })])
  })
})

describe('removeDeviceVideo', () => {
  it('removes only the named row', async () => {
    const db = createPrisma()
    db.seed([
      row({ videoId: 'cyc_01', status: 'ready' }),
      row({ videoId: 'other', status: 'ready' }),
    ])

    await removeDeviceVideo(db.prisma, {
      deviceId: 'headset-1',
      videoId: 'cyc_01',
    })

    expect(db.videos()).toEqual([row({ videoId: 'other', status: 'ready' })])
  })
})
