import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'
import { authed } from '../../middleware/auth.ts'
import {
  cancelDevicePairing,
  DevicePairingError,
  getDevicePairingStatus,
  startDevicePairing,
} from './device-pairing.ts'

const DeviceRecordInputSchema = z.object({
  deviceRecordId: z.string().trim().min(1),
})

const PairingAttemptInputSchema = z.object({
  attemptId: z.string().trim().min(1),
})

function throwPairingOrpcError(error: unknown): never {
  if (error instanceof DevicePairingError) {
    if (error.code === 'DEVICE_NOT_FOUND') {
      throw new ORPCError('NOT_FOUND', { message: error.message })
    }

    throw new ORPCError('CONFLICT', { message: error.message })
  }

  throw error
}

const start = authed
  .route({ path: '/device-pairing/start', method: 'POST' })
  .input(DeviceRecordInputSchema)
  .handler(async ({ context, input }) => {
    try {
      return await startDevicePairing(context.prisma, {
        deviceRecordId: input.deviceRecordId,
        userId: context.user.id,
      })
    } catch (error) {
      throwPairingOrpcError(error)
    }
  })

const status = authed
  .route({ path: '/device-pairing/status', method: 'GET' })
  .input(PairingAttemptInputSchema)
  .handler(async ({ context, input }) => {
    try {
      return await getDevicePairingStatus(context.prisma, {
        attemptId: input.attemptId,
        userId: context.user.id,
      })
    } catch (error) {
      throwPairingOrpcError(error)
    }
  })

const cancel = authed
  .route({ path: '/device-pairing/cancel', method: 'POST' })
  .input(PairingAttemptInputSchema)
  .handler(async ({ context, input }) => {
    try {
      return await cancelDevicePairing(context.prisma, {
        attemptId: input.attemptId,
        userId: context.user.id,
      })
    } catch (error) {
      throwPairingOrpcError(error)
    }
  })

export const devicePairing = { start, status, cancel }
