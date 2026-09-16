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
  reportedAt: Date | null
}
type VideoRow = {
  deviceId: string
  videoId: string
  status: string
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
        const videoIdMatches = (videoId: string) =>
          where.videoId == null ||
          (typeof where.videoId === 'string'
            ? videoId === where.videoId
            : !where.videoId.notIn.includes(videoId))
        videos = videos.filter(
          (row) =>
            row.deviceId !== where.deviceId ||
            !videoIdMatches(row.videoId) ||
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
      updateMany: vi.fn(async ({ where, data }) => {
        videos = videos.map((row) =>
          row.deviceId === where.deviceId &&
          row.videoId === where.videoId &&
          row.status === where.status
            ? { ...row, ...data }
            : row,
        )
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
    bytesDownloaded: null,
    sizeBytes: null,
    reason: null,
    ...overrides,
  }
}

describe('requestDeviceVideoDownload', () => {
  it('creates an undated report header without free space and a requested row', async () => {
    const db = createPrisma()

    await requestDeviceVideoDownload(db.prisma, {
      deviceId: 'headset-1',
      videoId: 'cyc_01',
    })

    expect(db.reports.get('headset-1')?.freeBytes).toBeNull()
    expect(db.reports.get('headset-1')?.reportedAt).toBeNull()
    expect(db.videos()).toEqual([
      row({ videoId: 'cyc_01', status: 'requested' }),
    ])
  })

  it('leaves the date of a report the headset already made alone', async () => {
    const db = createPrisma()
    const reportedAt = new Date('2026-09-01T10:00:00.000Z')
    db.reports.set('headset-1', {
      deviceId: 'headset-1',
      freeBytes: 7n,
      reportedAt,
    })

    await requestDeviceVideoDownload(db.prisma, {
      deviceId: 'headset-1',
      videoId: 'cyc_01',
    })

    expect(db.reports.get('headset-1')).toEqual({
      deviceId: 'headset-1',
      freeBytes: 7n,
      reportedAt,
    })
  })

  it('does not downgrade a download the headset already acknowledged', async () => {
    const db = createPrisma()
    db.seed([
      row({ videoId: 'cyc_01', status: 'downloading', bytesDownloaded: 3n }),
    ])

    await requestDeviceVideoDownload(db.prisma, {
      deviceId: 'headset-1',
      videoId: 'cyc_01',
    })

    expect(db.videos()).toEqual([
      row({ videoId: 'cyc_01', status: 'downloading', bytesDownloaded: 3n }),
    ])
  })

  it('re-requests a failed download', async () => {
    const db = createPrisma()
    db.seed([row({ videoId: 'cyc_01', status: 'failed', reason: 'network' })])

    await requestDeviceVideoDownload(db.prisma, {
      deviceId: 'headset-1',
      videoId: 'cyc_01',
    })

    expect(db.videos()).toEqual([
      row({ videoId: 'cyc_01', status: 'requested' }),
    ])
  })
})

describe('replaceDeviceVideoLibraryState', () => {
  it('replaces reported rows and keeps unmentioned requested rows', async () => {
    const db = createPrisma()
    db.seed([
      row({ videoId: 'old', status: 'ready' }),
      row({ videoId: 'pending', status: 'requested' }),
      row({ videoId: 'was-requested', status: 'requested' }),
    ])

    await replaceDeviceVideoLibraryState(db.prisma, {
      deviceId: 'headset-1',
      freeBytes: 42,
      videos: [
        { videoId: 'new', status: 'ready', sizeBytes: 10 },
        { videoId: 'was-requested', status: 'downloading', bytesDownloaded: 5 },
      ],
    })

    expect(db.reports.get('headset-1')?.freeBytes).toBe(42n)
    expect(db.videos()).toHaveLength(3)
    expect(db.videos()).toEqual(
      expect.arrayContaining([
        row({ videoId: 'pending', status: 'requested' }),
        row({ videoId: 'new', status: 'ready' }),
        row({
          videoId: 'was-requested',
          status: 'downloading',
          bytesDownloaded: 5n,
        }),
      ]),
    )
  })

  it('a report that omits bytes keeps them while the download is in flight', async () => {
    const db = createPrisma()
    db.seed([
      row({
        videoId: 'cyc_01',
        status: 'downloading',
        bytesDownloaded: 3n,
        sizeBytes: 9n,
      }),
    ])

    await replaceDeviceVideoLibraryState(db.prisma, {
      deviceId: 'headset-1',
      freeBytes: 12,
      videos: [{ videoId: 'cyc_01', status: 'downloading' }],
    })

    expect(db.videos()).toEqual([
      row({
        videoId: 'cyc_01',
        status: 'downloading',
        bytesDownloaded: 3n,
        sizeBytes: 9n,
      }),
    ])
  })

  it('a ready entry drops the byte counts recorded during the download', async () => {
    const db = createPrisma()
    db.seed([
      row({
        videoId: 'cyc_01',
        status: 'downloading',
        bytesDownloaded: 9n,
        sizeBytes: 9n,
      }),
    ])

    await replaceDeviceVideoLibraryState(db.prisma, {
      deviceId: 'headset-1',
      freeBytes: 12,
      videos: [{ videoId: 'cyc_01', status: 'ready', bytesDownloaded: 8 }],
    })

    expect(db.videos()).toEqual([row({ videoId: 'cyc_01', status: 'ready' })])
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
    expect(db.reports.get('headset-1')?.reportedAt?.getTime()).toBeGreaterThan(
      0,
    )
    expect(db.videos()).toEqual([
      row({
        videoId: 'cyc_01',
        status: 'downloading',
        bytesDownloaded: 3n,
        sizeBytes: 9n,
      }),
    ])
  })

  it('a complete event clears the in-flight byte counts', async () => {
    const db = createPrisma()
    db.seed([
      row({
        videoId: 'cyc_01',
        status: 'downloading',
        bytesDownloaded: 8n,
        sizeBytes: 9n,
      }),
    ])

    await applyDeviceVideoEvent(db.prisma, {
      deviceId: 'headset-1',
      videoId: 'cyc_01',
      status: 'ready',
    })

    expect(db.videos()).toEqual([row({ videoId: 'cyc_01', status: 'ready' })])
  })

  it('a retry clears the failure reason', async () => {
    const db = createPrisma()
    db.seed([row({ videoId: 'cyc_01', status: 'failed', reason: 'network' })])

    await applyDeviceVideoEvent(db.prisma, {
      deviceId: 'headset-1',
      videoId: 'cyc_01',
      status: 'downloading',
      bytesDownloaded: 0,
    })

    expect(db.videos()).toEqual([
      row({ videoId: 'cyc_01', status: 'downloading', bytesDownloaded: 0n }),
    ])
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
