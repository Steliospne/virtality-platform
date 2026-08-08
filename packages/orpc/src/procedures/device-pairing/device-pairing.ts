import { randomInt } from 'node:crypto'
import type { PrismaClient } from '@virtality/db'

export const DEVICE_PAIRING_EXPIRY_MS = 5 * 60 * 1000
export const DEVICE_PAIRING_REPLAY_MS = 10 * 60 * 1000

export type DevicePairingState =
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'superseded'
  | 'expired'

export type DevicePairingErrorCode =
  | 'DEVICE_NOT_FOUND'
  | 'DEVICE_ALREADY_PAIRED'
  | 'PAIRING_CODE_UNAVAILABLE'
  | 'PAIRING_CONFLICT'

export class DevicePairingError extends Error {
  constructor(
    public readonly code: DevicePairingErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'DevicePairingError'
  }
}

type PairingRuntime = {
  now?: () => Date
  generateCode?: () => string
}

type PairingAttemptStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SUPERSEDED'
  | 'EXPIRED'

const toState = (status: PairingAttemptStatus): DevicePairingState =>
  status.toLowerCase() as DevicePairingState

export function generatePairingCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

function getPrismaErrorCode(error: unknown): unknown {
  if (!error || typeof error !== 'object' || !('code' in error))
    return undefined
  return (error as { code?: unknown }).code
}

async function runWithTransactionRetry<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: unknown) => boolean,
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (!shouldRetry(error) || attempt === 4) throw error
    }
  }

  throw new Error('Device pairing transaction retry limit reached')
}

export async function startDevicePairing(
  prisma: PrismaClient,
  input: { deviceRecordId: string; userId: string },
  runtime: PairingRuntime = {},
) {
  const now = runtime.now?.() ?? new Date()
  const target = await prisma.device.findFirst({
    where: {
      id: input.deviceRecordId,
      userId: input.userId,
      deletedAt: null,
    },
    select: { id: true, deviceId: true },
  })

  if (!target) {
    throw new DevicePairingError('DEVICE_NOT_FOUND', 'Device not found.')
  }

  if (target.deviceId) {
    throw new DevicePairingError(
      'DEVICE_ALREADY_PAIRED',
      'This device record is already paired.',
    )
  }

  return runWithTransactionRetry(
    async () => {
      const code = runtime.generateCode?.() ?? generatePairingCode()
      const expiresAt = new Date(now.getTime() + DEVICE_PAIRING_EXPIRY_MS)

      const attempt = await prisma.$transaction(
        async (tx) => {
          await tx.devicePairingAttempt.updateMany({
            where: {
              deviceRecordId: input.deviceRecordId,
              status: 'PENDING',
              expiresAt: { lte: now },
            },
            data: {
              status: 'EXPIRED',
              activeCode: null,
              activeDeviceKey: null,
              expiredAt: now,
            },
          })

          await tx.devicePairingAttempt.updateMany({
            where: {
              deviceRecordId: input.deviceRecordId,
              status: 'PENDING',
            },
            data: {
              status: 'SUPERSEDED',
              activeCode: null,
              activeDeviceKey: null,
              supersededAt: now,
            },
          })

          return tx.devicePairingAttempt.create({
            data: {
              deviceRecordId: input.deviceRecordId,
              userId: input.userId,
              code,
              activeCode: code,
              activeDeviceKey: input.deviceRecordId,
              expiresAt,
            },
            select: { id: true, code: true, expiresAt: true },
          })
        },
        { isolationLevel: 'Serializable' },
      )

      return {
        attemptId: attempt.id,
        code: attempt.code,
        expiresAt: attempt.expiresAt,
        serverTime: now,
      }
    },
    (error) => {
      const code = getPrismaErrorCode(error)
      return code === 'P2002' || code === 'P2034'
    },
  )
}

export async function getDevicePairingStatus(
  prisma: PrismaClient,
  input: { attemptId: string; userId: string },
  runtime: Pick<PairingRuntime, 'now'> = {},
) {
  const now = runtime.now?.() ?? new Date()

  return prisma.$transaction(async (tx) => {
    let attempt = await tx.devicePairingAttempt.findFirst({
      where: { id: input.attemptId, userId: input.userId },
      select: { id: true, status: true, expiresAt: true },
    })

    if (!attempt) {
      throw new DevicePairingError(
        'DEVICE_NOT_FOUND',
        'Pairing attempt not found.',
      )
    }

    if (attempt.status === 'PENDING' && attempt.expiresAt <= now) {
      const expired = await tx.devicePairingAttempt.updateMany({
        where: { id: attempt.id, status: 'PENDING' },
        data: {
          status: 'EXPIRED',
          activeCode: null,
          activeDeviceKey: null,
          expiredAt: now,
        },
      })

      if (expired.count === 1) {
        attempt = { ...attempt, status: 'EXPIRED' }
      } else {
        const refreshed = await tx.devicePairingAttempt.findUniqueOrThrow({
          where: { id: attempt.id },
          select: { id: true, status: true, expiresAt: true },
        })
        attempt = refreshed
      }
    }

    return {
      attemptId: attempt.id,
      state: toState(attempt.status),
      expiresAt: attempt.expiresAt,
      serverTime: now,
    }
  })
}

export async function cancelDevicePairing(
  prisma: PrismaClient,
  input: { attemptId: string; userId: string },
  runtime: Pick<PairingRuntime, 'now'> = {},
) {
  const now = runtime.now?.() ?? new Date()

  return prisma.$transaction(async (tx) => {
    const attempt = await tx.devicePairingAttempt.findFirst({
      where: { id: input.attemptId, userId: input.userId },
      select: { id: true, status: true },
    })

    if (!attempt) {
      throw new DevicePairingError(
        'DEVICE_NOT_FOUND',
        'Pairing attempt not found.',
      )
    }

    if (attempt.status === 'PENDING') {
      const cancelled = await tx.devicePairingAttempt.updateMany({
        where: { id: attempt.id, status: 'PENDING' },
        data: {
          status: 'CANCELLED',
          activeCode: null,
          activeDeviceKey: null,
          cancelledAt: now,
        },
      })

      if (cancelled.count === 1) {
        return { state: 'cancelled' as const }
      }

      const refreshed = await tx.devicePairingAttempt.findUniqueOrThrow({
        where: { id: attempt.id },
        select: { status: true },
      })
      return { state: toState(refreshed.status) }
    }

    return { state: toState(attempt.status) }
  })
}

type ClaimTransactionResult =
  | { outcome: 'paired' }
  | { outcome: 'unavailable' }
  | { outcome: 'conflict' }

export async function claimDevicePairing(
  prisma: PrismaClient,
  input: { pairingCode: string; deviceId: string },
  runtime: Pick<PairingRuntime, 'now'> = {},
): Promise<{ status: 'paired' }> {
  const now = runtime.now?.() ?? new Date()
  const code = input.pairingCode.trim()
  const headsetDeviceId = input.deviceId.trim()

  let result: ClaimTransactionResult
  try {
    result = await runWithTransactionRetry(
      () =>
        prisma.$transaction<ClaimTransactionResult>(
          async (tx) => {
            const attempt = await tx.devicePairingAttempt.findFirst({
              where: { activeCode: code, status: 'PENDING' },
              orderBy: { createdAt: 'desc' },
            })

            if (!attempt) {
              const replay = await tx.devicePairingAttempt.findFirst({
                where: {
                  code,
                  status: 'COMPLETED',
                  headsetDeviceId,
                  completedAt: {
                    gte: new Date(now.getTime() - DEVICE_PAIRING_REPLAY_MS),
                  },
                },
                select: { id: true },
              })
              return replay ? { outcome: 'paired' } : { outcome: 'unavailable' }
            }

            if (attempt.expiresAt <= now) {
              await tx.devicePairingAttempt.update({
                where: { id: attempt.id },
                data: {
                  status: 'EXPIRED',
                  activeCode: null,
                  activeDeviceKey: null,
                  expiredAt: now,
                },
              })
              return { outcome: 'unavailable' }
            }

            const target = await tx.device.findFirst({
              where: {
                id: attempt.deviceRecordId,
                userId: attempt.userId,
                deletedAt: null,
              },
              select: { id: true, deviceId: true },
            })

            if (!target) {
              await tx.devicePairingAttempt.update({
                where: { id: attempt.id },
                data: {
                  status: 'SUPERSEDED',
                  activeCode: null,
                  activeDeviceKey: null,
                  supersededAt: now,
                },
              })
              return { outcome: 'unavailable' }
            }

            const conflictingDevice = await tx.device.findFirst({
              where: {
                deviceId: headsetDeviceId,
                deletedAt: null,
                id: { not: target.id },
              },
              select: { id: true },
            })

            if (
              conflictingDevice ||
              (target.deviceId && target.deviceId !== headsetDeviceId)
            ) {
              await tx.devicePairingAttempt.update({
                where: { id: attempt.id },
                data: {
                  status: 'SUPERSEDED',
                  activeCode: null,
                  activeDeviceKey: null,
                  supersededAt: now,
                },
              })
              return { outcome: 'conflict' }
            }

            if (!target.deviceId) {
              await tx.device.update({
                where: { id: target.id },
                data: { deviceId: headsetDeviceId },
              })
            }

            await tx.devicePairingAttempt.update({
              where: { id: attempt.id },
              data: {
                status: 'COMPLETED',
                headsetDeviceId,
                activeCode: null,
                activeDeviceKey: null,
                completedAt: now,
              },
            })

            return { outcome: 'paired' }
          },
          { isolationLevel: 'Serializable' },
        ),
      (error) => getPrismaErrorCode(error) === 'P2034',
    )
  } catch (error) {
    // The preflight conflict query is useful for a clear response, while the
    // database unique index remains the final authority under concurrent claims.
    if (getPrismaErrorCode(error) === 'P2002') {
      throw new DevicePairingError(
        'PAIRING_CONFLICT',
        'This headset is already paired to another device record.',
      )
    }
    throw error
  }

  if (result.outcome === 'unavailable') {
    throw new DevicePairingError(
      'PAIRING_CODE_UNAVAILABLE',
      'Pairing code is invalid or expired.',
    )
  }

  if (result.outcome === 'conflict') {
    throw new DevicePairingError(
      'PAIRING_CONFLICT',
      'This headset is already paired to another device record.',
    )
  }

  return { status: 'paired' }
}
