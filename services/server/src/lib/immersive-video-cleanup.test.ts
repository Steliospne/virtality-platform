import { describe, expect, it, vi } from 'vitest'
import { runImmersiveVideoCleanup } from './immersive-video-cleanup.ts'

const NOW = new Date('2026-09-12T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

function createLogger() {
  return {
    info: vi.fn(),
    error: vi.fn(),
  }
}

function createCleanupState(input?: {
  reports?: Array<{ deviceId: string; reportedAt: Date | null }>
  devices?: Array<{ deviceId: string; deletedAt: Date | null }>
}) {
  const reports = [...(input?.reports ?? [])]
  const devices = [...(input?.devices ?? [])]

  const prisma = {
    deviceVideoReport: {
      findMany: vi.fn(async () => reports),
      delete: vi.fn(async ({ where }: { where: { deviceId: string } }) => {
        const index = reports.findIndex(
          (row) => row.deviceId === where.deviceId,
        )
        if (index >= 0) {
          reports.splice(index, 1)
        }
      }),
    },
    device: {
      findFirst: vi.fn(async ({ where }: { where: { deviceId: string } }) => {
        const device = devices.find(
          (row) => row.deviceId === where.deviceId && row.deletedAt == null,
        )
        return device ? { id: device.deviceId } : null
      }),
    },
  }

  return { prisma, reports }
}

describe('runImmersiveVideoCleanup', () => {
  it('keeps a report younger than 180 days even when unpaired', async () => {
    const { prisma, reports } = createCleanupState({
      reports: [
        {
          deviceId: 'old-headset',
          reportedAt: new Date(NOW.getTime() - 10 * DAY),
        },
      ],
    })

    await runImmersiveVideoCleanup({
      prisma,
      logger: createLogger(),
      now: () => NOW,
    })

    expect(reports).toHaveLength(1)
  })

  it('deletes an unpaired report older than 180 days', async () => {
    const { prisma, reports } = createCleanupState({
      reports: [
        {
          deviceId: 'old-headset',
          reportedAt: new Date(NOW.getTime() - 181 * DAY),
        },
      ],
    })

    await runImmersiveVideoCleanup({
      prisma,
      logger: createLogger(),
      now: () => NOW,
    })

    expect(reports).toHaveLength(0)
  })

  it('deletes an unpaired header the headset never dated', async () => {
    const { prisma, reports } = createCleanupState({
      reports: [{ deviceId: 'old-headset', reportedAt: null }],
    })

    await runImmersiveVideoCleanup({
      prisma,
      logger: createLogger(),
      now: () => NOW,
    })

    expect(reports).toHaveLength(0)
  })

  it("never deletes a paired identity's report regardless of age", async () => {
    const { prisma, reports } = createCleanupState({
      reports: [
        {
          deviceId: 'headset-1',
          reportedAt: new Date(NOW.getTime() - 400 * DAY),
        },
      ],
      devices: [{ deviceId: 'headset-1', deletedAt: null }],
    })

    await runImmersiveVideoCleanup({
      prisma,
      logger: createLogger(),
      now: () => NOW,
    })

    expect(reports).toHaveLength(1)
  })
})
