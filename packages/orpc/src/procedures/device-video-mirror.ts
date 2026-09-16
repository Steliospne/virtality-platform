import type { DeviceVideoFailureReason, DeviceVideoStatus } from '@virtality/db'

/**
 * Library Mirror writer. The console is the only writer: it turns the
 * headset's socket events into rows, and records the physio's Download
 * Request as `requested` before the headset has said anything.
 *
 * Two rules keep the mirror honest:
 * - `videoLibraryState` is a full replace, except that `requested` rows the
 *   headset does not mention survive: the headset cannot report an intent it
 *   never received.
 * - Every other event patches exactly one row. An absent video is "no row":
 *   a cancel or delete the headset acknowledged removes it.
 * - `reportedAt` is stamped only by headset-derived writes; a Download
 *   Request alone leaves it null, so the offline view never dates a report
 *   the headset did not make.
 */

export type DeviceVideoEntryInput = {
  videoId: string
  status: Exclude<DeviceVideoStatus, 'requested'>
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
  bytesDownloaded: bigint | null
  sizeBytes: bigint | null
  reason: DeviceVideoFailureReason | null
}

export type MirrorPrisma = {
  deviceVideoReport: {
    upsert: (args: {
      where: { deviceId: string }
      create: {
        deviceId: string
        freeBytes: bigint | null
        reportedAt: Date | null
      }
      update: { freeBytes?: bigint; reportedAt?: Date }
    }) => Promise<unknown>
  }
  deviceVideo: {
    deleteMany: (args: {
      where: {
        deviceId: string
        videoId?: string | { notIn: string[] }
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
  const ready = entry.status === 'ready'
  return {
    deviceId,
    videoId: entry.videoId,
    status: entry.status,
    bytesDownloaded: ready ? null : toOptionalBigInt(entry.bytesDownloaded),
    sizeBytes: ready ? null : toOptionalBigInt(entry.sizeBytes),
    reason: ready ? null : (entry.reason ?? null),
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

/**
 * A byte field the event or report does not carry keeps its stored value
 * while the download is in flight (a `videoLibraryState` entry may be just
 * `videoId` + `status`). A `ready` row drops both: the file is whole, and
 * the headset's final counter is an estimate. `reason` belongs to `failed`
 * alone and is cleared by any other status.
 */
function toPatch(
  entry: DeviceVideoEntryInput,
): Partial<Omit<DeviceVideoRow, 'deviceId' | 'videoId'>> {
  if (entry.status === 'ready') {
    return {
      status: entry.status,
      reason: null,
      bytesDownloaded: null,
      sizeBytes: null,
    }
  }
  return {
    status: entry.status,
    reason: entry.reason ?? null,
    ...(entry.bytesDownloaded != null && {
      bytesDownloaded: toOptionalBigInt(entry.bytesDownloaded),
    }),
    ...(entry.sizeBytes != null && {
      sizeBytes: toOptionalBigInt(entry.sizeBytes),
    }),
  }
}

/**
 * Full replace from `videoLibraryState`: the set of rows becomes what the
 * headset listed, but an in-flight video keeps the byte counts the report
 * leaves out. Unmentioned `requested` rows survive.
 */
export async function replaceDeviceVideoLibraryState(
  prisma: MirrorPrisma,
  input: DeviceVideoLibraryStateInput,
): Promise<void> {
  const reportedAt = new Date()
  const freeBytes = BigInt(Math.trunc(input.freeBytes))

  await prisma.$transaction(async (tx) => {
    await touchReport(tx, input.deviceId, reportedAt, freeBytes)
    // Rows the headset stopped reporting go; listed ones are patched below.
    await tx.deviceVideo.deleteMany({
      where: {
        deviceId: input.deviceId,
        videoId: { notIn: input.videos.map((video) => video.videoId) },
        status: { not: 'requested' },
      },
    })
    // upsert so a reported video overwrites its own `requested` row.
    for (const video of input.videos) {
      await tx.deviceVideo.upsert({
        where: {
          deviceId_videoId: {
            deviceId: input.deviceId,
            videoId: video.videoId,
          },
        },
        create: toRow(input.deviceId, video),
        update: toPatch(video),
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
  const row: DeviceVideoRow = {
    deviceId: input.deviceId,
    videoId: input.videoId,
    status: 'requested',
    bytesDownloaded: null,
    sizeBytes: null,
    reason: null,
  }
  await prisma.$transaction(async (tx) => {
    // The headset has not spoken: create the header undated, leave one alone.
    await tx.deviceVideoReport.upsert({
      where: { deviceId: input.deviceId },
      create: { deviceId: input.deviceId, freeBytes: null, reportedAt: null },
      update: {},
    })
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

/** One headset event (ack, progress, paused, complete, failed) patches one row. */
export async function applyDeviceVideoEvent(
  prisma: MirrorPrisma,
  input: DeviceVideoEventInput,
): Promise<void> {
  const reportedAt = new Date()
  const { deviceId, ...entry } = input
  await prisma.$transaction(async (tx) => {
    await touchReport(tx, deviceId, reportedAt)
    await tx.deviceVideo.upsert({
      where: { deviceId_videoId: { deviceId, videoId: entry.videoId } },
      create: toRow(deviceId, entry),
      update: toPatch(entry),
    })
  })
}

/**
 * `videoDelete` / `videoDownloadCancel` acknowledged, or the physio withdrew a
 * `requested` download. Deletes the row only; the header keeps its date.
 */
export async function removeDeviceVideo(
  prisma: MirrorPrisma,
  input: { deviceId: string; videoId: string },
): Promise<void> {
  await prisma.deviceVideo.deleteMany({
    where: { deviceId: input.deviceId, videoId: input.videoId },
  })
}
