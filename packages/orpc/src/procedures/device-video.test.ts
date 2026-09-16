import type { PrismaClient } from '@virtality/db'
import { describe, expect, it, vi } from 'vitest'
import { listDeviceVideosForUser } from './device-video.ts'

type DeviceRow = {
  id: string
  name: string
  userId: string
  deviceId: string | null
  deletedAt: Date | null
}

type ReportRow = {
  deviceId: string
  freeBytes: bigint
  reportedAt: Date | null
  videos: Array<{
    videoId: string
    status: 'downloading' | 'paused' | 'ready' | 'failed'
    bytesDownloaded: bigint | null
    sizeBytes: bigint | null
    reason: 'network' | null
  }>
}

function matchesDeviceWhere(
  device: DeviceRow,
  where: Record<string, unknown>,
): boolean {
  if (typeof where.userId === 'string' && device.userId !== where.userId) {
    return false
  }
  if (where.deletedAt === null && device.deletedAt != null) {
    return false
  }
  if (
    where.deviceId &&
    typeof where.deviceId === 'object' &&
    (where.deviceId as { not?: unknown }).not === null &&
    device.deviceId == null
  ) {
    return false
  }
  if (Array.isArray(where.AND)) {
    return where.AND.every((part) =>
      matchesDeviceWhere(device, part as Record<string, unknown>),
    )
  }
  return true
}

function createPrisma(devices: DeviceRow[], reports: ReportRow[]) {
  return {
    device: {
      findMany: vi.fn(
        async ({
          where,
          orderBy,
        }: {
          where: Record<string, unknown>
          orderBy?: { name?: 'asc' | 'desc' }
        }) => {
          let rows = devices.filter((device) =>
            matchesDeviceWhere(device, where),
          )
          if (orderBy?.name === 'asc') {
            rows = [...rows].sort((left, right) =>
              left.name.localeCompare(right.name),
            )
          }
          return rows.map((device) => ({
            id: device.id,
            name: device.name,
            deviceId: device.deviceId,
          }))
        },
      ),
    },
    deviceVideoReport: {
      findMany: vi.fn(
        async ({ where }: { where: { deviceId: { in: string[] } } }) =>
          reports.filter((report) =>
            where.deviceId.in.includes(report.deviceId),
          ),
      ),
    },
  } as unknown as PrismaClient
}

describe('deviceVideo.listForUser', () => {
  const reportedAt = new Date('2026-09-01T10:00:00.000Z')

  const devices: DeviceRow[] = [
    {
      id: 'device-zed',
      name: 'Zed',
      userId: 'user-1',
      deviceId: 'headset-zed',
      deletedAt: null,
    },
    {
      id: 'device-alpha',
      name: 'Alpha',
      userId: 'user-1',
      deviceId: 'headset-alpha',
      deletedAt: null,
    },
    {
      id: 'device-other',
      name: 'Other',
      userId: 'user-2',
      deviceId: 'headset-other',
      deletedAt: null,
    },
    {
      id: 'device-unbound',
      name: 'Unbound',
      userId: 'user-1',
      deviceId: null,
      deletedAt: null,
    },
  ]

  const reports: ReportRow[] = [
    {
      deviceId: 'headset-zed',
      freeBytes: 2048n,
      reportedAt,
      videos: [
        {
          videoId: 'video-1',
          status: 'ready',
          bytesDownloaded: 100n,
          sizeBytes: 100n,
          reason: null,
        },
      ],
    },
  ]

  it('returns only the caller devices, ordered by name, with BigInt numbers', async () => {
    const prisma = createPrisma(devices, reports)
    const result = await listDeviceVideosForUser(prisma, 'user-1')

    expect(result.devices.map((device) => device.id)).toEqual([
      'device-alpha',
      'device-zed',
    ])
    expect(result.devices[0]).toMatchObject({
      id: 'device-alpha',
      name: 'Alpha',
      deviceId: 'headset-alpha',
      report: null,
    })
    expect(result.devices[1]?.report).toEqual({
      reportedAt: reportedAt.toISOString(),
      freeBytes: 2048,
      videos: [
        {
          videoId: 'video-1',
          status: 'ready',
          bytesDownloaded: 100,
          sizeBytes: 100,
          reason: null,
        },
      ],
    })
  })

  it("excludes another user's headset", async () => {
    const prisma = createPrisma(devices, reports)
    const result = await listDeviceVideosForUser(prisma, 'user-1')

    expect(
      result.devices.some((device) => device.deviceId === 'headset-other'),
    ).toBe(false)
  })

  it('returns report null when the identity never reported', async () => {
    const prisma = createPrisma(devices, reports)
    const result = await listDeviceVideosForUser(prisma, 'user-1')
    const alpha = result.devices.find((device) => device.id === 'device-alpha')

    expect(alpha?.report).toBeNull()
  })
})
