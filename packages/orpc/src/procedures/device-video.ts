import type { DeviceVideoStatus, PrismaClient } from '@virtality/db'
import { ORPCError } from '@orpc/server'
import { createAppLogger } from '@virtality/shared/observability'
import {
  VIDEO_DEVICE_STATUS,
  VIDEO_DOWNLOAD_FAILURE_REASON,
  type VideoDownloadFailureReason,
} from '@virtality/shared/types'
import { z } from 'zod/v4'
import { authed } from '../middleware/auth.ts'
import {
  applyDeviceVideoEvent,
  removeDeviceVideo,
  replaceDeviceVideoLibraryState,
  requestDeviceVideoDownload,
} from './device-video-mirror.ts'
import { toSizeBytesNumber } from './immersive-video-constants.ts'

const deviceVideoLogger = createAppLogger({
  serviceName: 'server',
  defaultAttributes: {
    component: 'device-video',
  },
})

export type DeviceVideoListItem = {
  videoId: string
  status: DeviceVideoStatus
  version: number | null
  bytesDownloaded: number | null
  sizeBytes: number | null
  reason: VideoDownloadFailureReason | null
}

export type DeviceVideoListForUserResult = {
  devices: Array<{
    id: string
    name: string
    deviceId: string
    report: null | {
      reportedAt: string
      freeBytes: number | null
      videos: DeviceVideoListItem[]
    }
  }>
}

type DeviceVideoReportRow = {
  deviceId: string
  freeBytes: bigint | number | null
  reportedAt: Date
  videos: Array<{
    videoId: string
    status: DeviceVideoStatus
    version: number | null
    bytesDownloaded: bigint | number | null
    sizeBytes: bigint | number | null
    reason: VideoDownloadFailureReason | null
  }>
}

function toBoundDevice(device: {
  id: string
  name: string
  deviceId: string | null
}): { id: string; name: string; deviceId: string } | null {
  if (device.deviceId == null) {
    return null
  }
  return { id: device.id, name: device.name, deviceId: device.deviceId }
}

function toListReport(
  report: DeviceVideoReportRow | undefined,
): DeviceVideoListForUserResult['devices'][number]['report'] {
  if (!report) {
    return null
  }

  return {
    reportedAt: report.reportedAt.toISOString(),
    freeBytes: toSizeBytesNumber(report.freeBytes),
    videos: report.videos.map((video) => ({
      videoId: video.videoId,
      status: video.status,
      version: video.version,
      bytesDownloaded: toSizeBytesNumber(video.bytesDownloaded),
      sizeBytes: toSizeBytesNumber(video.sizeBytes),
      reason: video.reason,
    })),
  }
}

export async function listDeviceVideosForUser(
  prisma: PrismaClient,
  userId: string,
): Promise<DeviceVideoListForUserResult> {
  const rows = await prisma.device.findMany({
    where: {
      userId,
      AND: [{ deletedAt: null }],
      deviceId: { not: null },
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, deviceId: true },
  })

  const devices = rows.flatMap((device) => {
    const bound = toBoundDevice(device)
    return bound ? [bound] : []
  })

  const identities = devices.map((device) => device.deviceId)
  const reports: DeviceVideoReportRow[] =
    identities.length === 0
      ? []
      : await prisma.deviceVideoReport.findMany({
          where: { deviceId: { in: identities } },
          include: { videos: true },
        })

  const reportsByIdentity = new Map(
    reports.map((report) => [report.deviceId, report]),
  )

  return {
    devices: devices.map((device) => ({
      id: device.id,
      name: device.name,
      deviceId: device.deviceId,
      report: toListReport(reportsByIdentity.get(device.deviceId)),
    })),
  }
}

const listForUser = authed
  .route({ path: '/device-video/list-for-user', method: 'GET' })
  .handler(async ({ context }) =>
    listDeviceVideosForUser(context.prisma, context.user.id),
  )

// ── Library Mirror writes (console only; ADR 0013) ───────────────────────

const HeadsetIdentitySchema = z.string().trim().min(1).max(128)
const VideoIdSchema = z.string().min(1)

const LibraryEntrySchema = z.object({
  videoId: VideoIdSchema,
  status: z.enum([
    VIDEO_DEVICE_STATUS.Downloading,
    VIDEO_DEVICE_STATUS.Paused,
    VIDEO_DEVICE_STATUS.Ready,
    VIDEO_DEVICE_STATUS.Failed,
  ]),
  version: z.number().int().nonnegative().optional(),
  bytesDownloaded: z.number().finite().nonnegative().optional(),
  sizeBytes: z.number().finite().nonnegative().optional(),
  reason: z
    .enum([
      VIDEO_DOWNLOAD_FAILURE_REASON.InsufficientStorage,
      VIDEO_DOWNLOAD_FAILURE_REASON.Network,
      VIDEO_DOWNLOAD_FAILURE_REASON.ChecksumMismatch,
      VIDEO_DOWNLOAD_FAILURE_REASON.Cancelled,
      VIDEO_DOWNLOAD_FAILURE_REASON.UrlExpired,
      VIDEO_DOWNLOAD_FAILURE_REASON.Unavailable,
    ])
    .optional(),
})

const HeadsetVideoSchema = z.object({
  deviceId: HeadsetIdentitySchema,
  videoId: VideoIdSchema,
})

/**
 * The mirror is keyed by Headset Identity; only its owner may write it.
 * The console swallows a rejected write, so the refusal is logged here where
 * it can be found when a physio reports a download that "did not save".
 */
export async function assertOwnedHeadset(
  prisma: Pick<PrismaClient, 'device'>,
  userId: string,
  deviceId: string,
  procedure?: string,
): Promise<void> {
  const owned = await prisma.device.findFirst({
    where: { deviceId, userId, deletedAt: null },
    select: { id: true },
  })
  if (!owned) {
    deviceVideoLogger.warn('device-video.mirror.write.rejected', {
      reason: 'headset_not_owned',
      procedure,
      deviceId,
      userId,
    })
    throw new ORPCError('NOT_FOUND', { message: 'Headset not found.' })
  }
}

const reportLibraryState = authed
  .route({ path: '/device-video/report-library-state', method: 'POST' })
  .input(
    z.object({
      deviceId: HeadsetIdentitySchema,
      freeBytes: z.number().finite().nonnegative(),
      videos: z.array(LibraryEntrySchema).max(64),
    }),
  )
  .handler(async ({ context, input }) => {
    await assertOwnedHeadset(
      context.prisma,
      context.user.id,
      input.deviceId,
      'reportLibraryState',
    )
    await replaceDeviceVideoLibraryState(context.prisma, input)
  })

const requestDownload = authed
  .route({ path: '/device-video/request-download', method: 'POST' })
  .input(HeadsetVideoSchema)
  .handler(async ({ context, input }) => {
    await assertOwnedHeadset(
      context.prisma,
      context.user.id,
      input.deviceId,
      'requestDownload',
    )
    await requestDeviceVideoDownload(context.prisma, input)
  })

const applyEvent = authed
  .route({ path: '/device-video/apply-event', method: 'POST' })
  .input(LibraryEntrySchema.extend({ deviceId: HeadsetIdentitySchema }))
  .handler(async ({ context, input }) => {
    await assertOwnedHeadset(
      context.prisma,
      context.user.id,
      input.deviceId,
      'applyEvent',
    )
    await applyDeviceVideoEvent(context.prisma, input)
  })

const remove = authed
  .route({ path: '/device-video/remove', method: 'POST' })
  .input(HeadsetVideoSchema)
  .handler(async ({ context, input }) => {
    await assertOwnedHeadset(
      context.prisma,
      context.user.id,
      input.deviceId,
      'remove',
    )
    await removeDeviceVideo(context.prisma, input)
  })

export const deviceVideo = {
  listForUser,
  reportLibraryState,
  requestDownload,
  applyEvent,
  remove,
}
