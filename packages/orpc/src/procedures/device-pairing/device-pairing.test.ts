import type { PrismaClient } from '@virtality/db'
import { describe, expect, it, vi } from 'vitest'
import {
  cancelDevicePairing,
  claimDevicePairing,
  generatePairingCode,
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
  it('generates zero-padded six-digit numeric codes', () => {
    for (let index = 0; index < 100; index++) {
      expect(generatePairingCode()).toMatch(/^\d{6}$/)
    }
  })

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

  it('supersedes an active attempt before creating the replacement', async () => {
    const now = new Date('2026-08-08T10:00:00.000Z')
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    const create = vi.fn().mockResolvedValue({
      id: 'attempt-2',
      code: '123456',
      expiresAt: new Date(now.getTime() + 300_000),
    })
    const tx = { devicePairingAttempt: { updateMany, create } }
    const prisma = transactionalPrisma(tx)
    Object.assign(prisma, {
      device: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: 'device-1', deviceId: null }),
      },
    })

    const result = await startDevicePairing(
      prisma,
      { deviceRecordId: 'device-1', userId: 'user-1' },
      { now: () => now, generateCode: () => '123456' },
    )

    expect(result).toMatchObject({ attemptId: 'attempt-2', code: '123456' })
    expect(updateMany).toHaveBeenCalledTimes(2)
    expect(updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SUPERSEDED' }),
      }),
    )
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          activeCode: '123456',
          activeDeviceKey: 'device-1',
        }),
      }),
    )
  })

  it('marks a pending attempt expired when status is read after expiry', async () => {
    const now = new Date('2026-08-08T10:10:00.000Z')
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    const tx = {
      devicePairingAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          status: 'PENDING',
          expiresAt: new Date('2026-08-08T10:05:00.000Z'),
        }),
        updateMany,
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
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          activeCode: null,
          activeDeviceKey: null,
          status: 'EXPIRED',
        }),
      }),
    )
  })

  it('does not overwrite a terminal state when cancellation loses a race', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 })
    const tx = {
      devicePairingAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          status: 'PENDING',
        }),
        updateMany,
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
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'attempt-1', status: 'PENDING' },
      }),
    )
  })

  it('assigns the headset and completes the attempt in one transaction', async () => {
    const now = new Date('2026-08-08T10:01:00.000Z')
    const updateDevice = vi.fn().mockResolvedValue({ id: 'device-1' })
    const updateAttempt = vi.fn().mockResolvedValue({ id: 'attempt-1' })
    const tx = {
      devicePairingAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          deviceRecordId: 'device-1',
          userId: 'user-1',
          expiresAt: new Date('2026-08-08T10:05:00.000Z'),
        }),
        update: updateAttempt,
      },
      device: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ id: 'device-1', deviceId: null })
          .mockResolvedValueOnce(null),
        update: updateDevice,
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
    expect(updateDevice).toHaveBeenCalledWith({
      where: { id: 'device-1' },
      data: { deviceId: 'headset-1' },
    })
    expect(updateAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPLETED',
          headsetDeviceId: 'headset-1',
          activeCode: null,
          activeDeviceKey: null,
        }),
      }),
    )
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
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })
})
