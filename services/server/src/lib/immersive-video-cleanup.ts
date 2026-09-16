import type { AppLogger } from '@virtality/shared/observability'
import { findPairedDeviceByHeadsetIdentity } from './device-video-pairing.ts'

const RETENTION_MS = 180 * 24 * 60 * 60 * 1000

/** Nightly Library Mirror retention. Catalog objects are swept by nothing here: a republish deletes its predecessor. */
export type ImmersiveVideoCleanupPrisma = {
  deviceVideoReport: {
    findMany: () => Promise<
      Array<{ deviceId: string; reportedAt: Date | null }>
    >
    delete: (args: { where: { deviceId: string } }) => Promise<unknown>
  }
  device: {
    findFirst: (args: {
      where: { deviceId: string; AND: [{ deletedAt: null }] }
      select: { id: true }
    }) => Promise<{ id: string } | null>
  }
}

type CleanupLogger = Pick<AppLogger, 'info' | 'error'>

async function deleteStaleUnpairedReports(input: {
  prisma: ImmersiveVideoCleanupPrisma
  logger: CleanupLogger
  cutoff: Date
}): Promise<{ deleted: number; failures: number }> {
  const { prisma, logger, cutoff } = input
  let deleted = 0
  let failures = 0

  const reports = await prisma.deviceVideoReport.findMany()
  for (const report of reports) {
    try {
      // A header the headset never dated only holds stale requests; once
      // the headset is unpaired it goes with the dated ones.
      if (
        report.reportedAt &&
        report.reportedAt.getTime() >= cutoff.getTime()
      ) {
        continue
      }
      const paired = await findPairedDeviceByHeadsetIdentity(
        prisma,
        report.deviceId,
      )
      if (paired) {
        continue
      }
      await prisma.deviceVideoReport.delete({
        where: { deviceId: report.deviceId },
      })
      deleted += 1
    } catch (error) {
      failures += 1
      logger.error(
        'immersive-video.cleanup.report.failed',
        { error, deviceId: report.deviceId },
        'Failed to clean a Library Mirror report',
      )
    }
  }

  return { deleted, failures }
}

export async function runImmersiveVideoCleanup(input: {
  prisma: ImmersiveVideoCleanupPrisma
  logger: CleanupLogger
  now?: () => Date
}): Promise<void> {
  const { prisma, logger } = input
  const now = input.now?.() ?? new Date()

  const reports = await deleteStaleUnpairedReports({
    prisma,
    logger,
    cutoff: new Date(now.getTime() - RETENTION_MS),
  })

  logger.info('immersive-video.cleanup.completed', {
    reportsDeleted: reports.deleted,
    failures: reports.failures,
  })
}
