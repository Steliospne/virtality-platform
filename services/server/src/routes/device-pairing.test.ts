import { beforeEach, describe, expect, it, vi } from 'vitest'

const { claimDevicePairing, findFirst } = vi.hoisted(() => ({
  claimDevicePairing: vi.fn(),
  findFirst: vi.fn(),
}))

vi.mock('@virtality/db', () => ({
  prisma: { device: { findFirst } },
}))

vi.mock('@virtality/orpc/server', () => {
  class DevicePairingError extends Error {
    constructor(
      public readonly code: string,
      message: string,
    ) {
      super(message)
    }
  }

  return { claimDevicePairing, DevicePairingError }
})

import { DevicePairingError } from '@virtality/orpc/server'
import { devicePairingRoutes } from './device-pairing.ts'

describe('public device pairing routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects malformed claim payloads without calling the lifecycle', async () => {
    const response = await devicePairingRoutes.request('/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pairingCode: '123', deviceId: '' }),
    })

    expect(response.status).toBe(400)
    expect(claimDevicePairing).not.toHaveBeenCalled()
  })

  it('returns paired for a valid claim', async () => {
    claimDevicePairing.mockResolvedValue({ status: 'paired' })

    const response = await devicePairingRoutes.request('/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pairingCode: '123456',
        deviceId: 'headset-1',
      }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'paired' })
  })

  it('maps unavailable codes to a stable 404 response', async () => {
    claimDevicePairing.mockRejectedValue(
      new DevicePairingError(
        'PAIRING_CODE_UNAVAILABLE',
        'Pairing code is invalid or expired.',
      ),
    )

    const response = await devicePairingRoutes.request('/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pairingCode: '123456',
        deviceId: 'headset-1',
      }),
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({
      error: 'PAIRING_CODE_UNAVAILABLE',
    })
  })

  it('returns only paired state for registration checks', async () => {
    findFirst.mockResolvedValue({ id: 'device-1' })

    const response = await devicePairingRoutes.request(
      '/registrations/headset-1',
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ paired: true })
    expect(findFirst).toHaveBeenCalledWith({
      where: { deviceId: 'headset-1', deletedAt: null },
      select: { id: true },
    })
  })
})
