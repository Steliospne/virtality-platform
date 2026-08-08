import type { PrismaClient } from '@virtality/db'
import { describe, expect, it, vi } from 'vitest'
import {
  cancelDevicePairing,
  claimDevicePairing,
  getDevicePairingStatus,
  startDevicePairing,
} from './device-pairing.ts'

function transactionalPrisma(transaction: Record<string, unknown>) {
  return {
    $transaction: vi.fn(async (operation: (tx: unknown) => unknown) =>
      operation(transaction),
    ),
  } as unknown as PrismaClient
}

describe('device pairing lifecycle', () => {
  it('rejects starting an attempt for a device outside the user account', async () => {
    const prisma = {
      device: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaClient

    await expect(
      startDevicePairing(
        prisma,
        { deviceRecordId: 'device-1', userId: 'user-1' },
        { generateCode: () => '123456' },
      ),
    ).rejects.toMatchObject({ code: 'DEVICE_NOT_FOUND' })
  })

  it('rejects starting when the device is already paired', async () => {
    const prisma = {
      device: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: 'device-1', deviceId: 'headset-1' }),
      },
    } as unknown as PrismaClient

    await expect(
      startDevicePairing(
        prisma,
        { deviceRecordId: 'device-1', userId: 'user-1' },
        { generateCode: () => '123456' },
      ),
    ).rejects.toMatchObject({ code: 'DEVICE_ALREADY_PAIRED' })
  })

  it('starts a pairing attempt for an unbound device', async () => {
    const now = new Date('2026-08-08T10:00:00.000Z')
    const tx = {
      devicePairingAttempt: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({
          id: 'attempt-2',
          code: '123456',
          expiresAt: new Date(now.getTime() + 300_000),
        }),
      },
    }
    const prisma = transactionalPrisma(tx)
    Object.assign(prisma, {
      device: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: 'device-1', deviceId: null }),
      },
    })

    await expect(
      startDevicePairing(
        prisma,
        { deviceRecordId: 'device-1', userId: 'user-1' },
        { now: () => now, generateCode: () => '123456' },
      ),
    ).resolves.toMatchObject({
      attemptId: 'attempt-2',
      code: '123456',
    })
  })

  it('marks a pending attempt expired when status is read after expiry', async () => {
    const now = new Date('2026-08-08T10:10:00.000Z')
    const tx = {
      devicePairingAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          status: 'PENDING',
          expiresAt: new Date('2026-08-08T10:05:00.000Z'),
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    }
    const prisma = transactionalPrisma(tx)

    await expect(
      getDevicePairingStatus(
        prisma,
        { attemptId: 'attempt-1', userId: 'user-1' },
        { now: () => now },
      ),
    ).resolves.toMatchObject({ state: 'expired' })
  })

  it('returns the terminal state when cancellation loses a race', async () => {
    const tx = {
      devicePairingAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          status: 'PENDING',
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          status: 'COMPLETED',
        }),
      },
    }
    const prisma = transactionalPrisma(tx)

    await expect(
      cancelDevicePairing(prisma, {
        attemptId: 'attempt-1',
        userId: 'user-1',
      }),
    ).resolves.toEqual({ state: 'completed' })
  })

  it('claims a valid code and returns paired', async () => {
    const now = new Date('2026-08-08T10:01:00.000Z')
    const tx = {
      devicePairingAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          deviceRecordId: 'device-1',
          userId: 'user-1',
          expiresAt: new Date('2026-08-08T10:05:00.000Z'),
        }),
        update: vi.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
      device: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ id: 'device-1', deviceId: null })
          .mockResolvedValueOnce(null),
        update: vi.fn().mockResolvedValue({ id: 'device-1' }),
      },
    }
    const prisma = transactionalPrisma(tx)

    await expect(
      claimDevicePairing(
        prisma,
        { pairingCode: '123456', deviceId: 'headset-1' },
        { now: () => now },
      ),
    ).resolves.toEqual({ status: 'paired' })
  })

  it('accepts a recent repeated claim from the same headset', async () => {
    const tx = {
      devicePairingAttempt: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'attempt-1' }),
      },
    }
    const prisma = transactionalPrisma(tx)

    await expect(
      claimDevicePairing(prisma, {
        pairingCode: '123456',
        deviceId: 'headset-1',
      }),
    ).resolves.toEqual({ status: 'paired' })
  })

  it('maps a concurrent unique-device assignment to a pairing conflict', async () => {
    const prisma = {
      $transaction: vi.fn().mockRejectedValue({ code: 'P2002' }),
    } as unknown as PrismaClient

    await expect(
      claimDevicePairing(prisma, {
        pairingCode: '123456',
        deviceId: 'headset-1',
      }),
    ).rejects.toMatchObject({ code: 'PAIRING_CONFLICT' })
  })
})
