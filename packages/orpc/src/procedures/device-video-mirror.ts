import type { DeviceVideoFailureReason, DeviceVideoStatus } from '@virtality/db'

/**
 * Library Mirror writer (ADR 0013). The console is the only writer: it turns
 * the headset's socket events into rows, and records the physio's Download
 * Request as `requested` before the headset has said anything.
 *
 * Two rules keep the mirror honest:
 * - `videoLibraryState` is a full replace, except that `requested` rows the
 *   headset does not mention survive: the headset cannot report an intent it
 *   never received.
 * - Every other event patches exactly one row; a `cancelled` failure removes
 *   it, because an absent video is "no row".
 */

export type DeviceVideoEntryInput = {
  videoId: string
  status: Exclude<DeviceVideoStatus, 'requested'>
  version?: number
  bytesDownloaded?: number
  sizeBytes?: number
  reason?: DeviceVideoFailureReason
}

export type DeviceVideoLibraryStateInput = {
  deviceId: string
  freeBytes: number
  videos: DeviceVideoEntryInput[]
}

export type DeviceVideoEventInput = {
  deviceId: string
} & DeviceVideoEntryInput

type DeviceVideoRow = {
  deviceId: string
  videoId: string
  status: DeviceVideoStatus
  version: number | null
  bytesDownloaded: bigint | null
  sizeBytes: bigint | null
  reason: DeviceVideoFailureReason | null
}

export type MirrorPrisma = {
  deviceVideoReport: {
    upsert: (args: {
      where: { deviceId: string }
      create: { deviceId: string; freeBytes: bigint | null; reportedAt: Date }
      update: { freeBytes?: bigint; reportedAt: Date }
    }) => Promise<unknown>
  }
  deviceVideo: {
    deleteMany: (args: {
      where: {
        deviceId: string
        videoId?: string
        status?: { not: DeviceVideoStatus }
      }
    }) => Promise<unknown>
    upsert: (args: {
      where: { deviceId_videoId: { deviceId: string; videoId: string } }
      create: DeviceVideoRow
      update: Partial<Omit<DeviceVideoRow, 'deviceId' | 'videoId'>>
    }) => Promise<unknown>
    updateMany: (args: {
      where: { deviceId: string; videoId: string; status: DeviceVideoStatus }
      data: Partial<Omit<DeviceVideoRow, 'deviceId' | 'videoId'>>
    }) => Promise<unknown>
  }
  $transaction: <T>(fn: (tx: MirrorPrisma) => Promise<T>) => Promise<T>
}

function toOptionalBigInt(value: number | undefined): bigint | null {
  if (value == null) {
    return null
  }
  return BigInt(Math.trunc(value))
}

function toRow(deviceId: string, entry: DeviceVideoEntryInput): DeviceVideoRow {
  return {
    deviceId,
    videoId: entry.videoId,
    status: entry.status,
    version: entry.version ?? null,
    bytesDownloaded: toOptionalBigInt(entry.bytesDownloaded),
    sizeBytes: toOptionalBigInt(entry.sizeBytes),
    reason: entry.reason ?? null,
  }
}

async function touchReport(
  tx: MirrorPrisma,
  deviceId: string,
  reportedAt: Date,
  freeBytes?: bigint,
): Promise<void> {
  await tx.deviceVideoReport.upsert({
    where: { deviceId },
    create: { deviceId, freeBytes: freeBytes ?? null, reportedAt },
    update: freeBytes == null ? { reportedAt } : { freeBytes, reportedAt },
  })
}

/** Full replace from `videoLibraryState`; unmentioned `requested` rows survive. */
export async function replaceDeviceVideoLibraryState(
  prisma: MirrorPrisma,
  input: DeviceVideoLibraryStateInput,
): Promise<void> {
  const reportedAt = new Date()
  const freeBytes = BigInt(Math.trunc(input.freeBytes))

  await prisma.$transaction(async (tx) => {
    await touchReport(tx, input.deviceId, reportedAt, freeBytes)
    await tx.deviceVideo.deleteMany({
      where: { deviceId: input.deviceId, status: { not: 'requested' } },
    })
    // upsert so a reported video overwrites its own `requested` row.
    for (const video of input.videos) {
      const row = toRow(input.deviceId, video)
      await tx.deviceVideo.upsert({
        where: {
          deviceId_videoId: {
            deviceId: input.deviceId,
            videoId: video.videoId,
          },
        },
        create: row,
        update: row,
      })
    }
  })
}

/**
 * The physio asked for a download; recorded before the headset answers.
 * The headset's ack can commit before this does, so an existing row is only
 * re-marked `requested` when it was `failed`: never downgrade a live download.
 */
export async function requestDeviceVideoDownload(
  prisma: MirrorPrisma,
  input: { deviceId: string; videoId: string },
): Promise<void> {
  const reportedAt = new Date()
  const row: DeviceVideoRow = {
    deviceId: input.deviceId,
    videoId: input.videoId,
    status: 'requested',
    version: null,
    bytesDownloaded: null,
    sizeBytes: null,
    reason: null,
  }
  await prisma.$transaction(async (tx) => {
    await touchReport(tx, input.deviceId, reportedAt)
    const where = {
      deviceId_videoId: { deviceId: input.deviceId, videoId: input.videoId },
    }
    await tx.deviceVideo.upsert({ where, create: row, update: {} })
    await tx.deviceVideo.updateMany({
      where: { ...where.deviceId_videoId, status: 'failed' },
      data: { status: 'requested', reason: null },
    })
  })
}

/**
 * A field the event does not carry keeps its stored value (`videoDownloadComplete`
 * has no bytes or version); `reason` belongs to `failed` alone and is cleared
 * by any other status.
 */
function toPatch(
  entry: DeviceVideoEntryInput,
): Partial<Omit<DeviceVideoRow, 'deviceId' | 'videoId'>> {
  return {
    status: entry.status,
    reason: entry.reason ?? null,
    ...(entry.version != null && { version: entry.version }),
    ...(entry.bytesDownloaded != null && {
      bytesDownloaded: toOptionalBigInt(entry.bytesDownloaded),
    }),
    ...(entry.sizeBytes != null && {
      sizeBytes: toOptionalBigInt(entry.sizeBytes),
    }),
  }
}

/** One headset event (ack, progress, paused, complete, failed) patches one row. */
export async function applyDeviceVideoEvent(
  prisma: MirrorPrisma,
  input: DeviceVideoEventInput,
): Promise<void> {
  const reportedAt = new Date()
  const { deviceId, ...entry } = input
  await prisma.$transaction(async (tx) => {
    await touchReport(tx, deviceId, reportedAt)
    if (entry.status === 'failed' && entry.reason === 'cancelled') {
      await tx.deviceVideo.deleteMany({
        where: { deviceId, videoId: entry.videoId },
      })
      return
    }
    await tx.deviceVideo.upsert({
      where: { deviceId_videoId: { deviceId, videoId: entry.videoId } },
      create: toRow(deviceId, entry),
      update: toPatch(entry),
    })
  })
}

/** `videoDelete` acknowledged, or the physio withdrew a `requested` download. */
export async function removeDeviceVideo(
  prisma: MirrorPrisma,
  input: { deviceId: string; videoId: string },
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await touchReport(tx, input.deviceId, new Date())
    await tx.deviceVideo.deleteMany({
      where: { deviceId: input.deviceId, videoId: input.videoId },
    })
  })
}
