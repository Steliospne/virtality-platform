import { Hono } from 'hono'
import { z } from 'zod/v4'
import { prisma } from '@virtality/db'
import { claimDevicePairing, DevicePairingError } from '@virtality/orpc/server'

const ClaimDevicePairingSchema = z.object({
  pairingCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
  deviceId: z.string().trim().min(1).max(128),
})

export const devicePairingRoutes = new Hono()

devicePairingRoutes.post('/claim', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = ClaimDevicePairingSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: 'INVALID_REQUEST', message: 'Invalid pairing request.' },
      400,
    )
  }

  try {
    return c.json(await claimDevicePairing(prisma, parsed.data))
  } catch (error) {
    if (error instanceof DevicePairingError) {
      if (error.code === 'PAIRING_CODE_UNAVAILABLE') {
        return c.json(
          { error: error.code, message: 'Pairing code is invalid or expired.' },
          404,
        )
      }

      if (error.code === 'PAIRING_CONFLICT') {
        return c.json(
          { error: error.code, message: 'This headset is already paired.' },
          409,
        )
      }
    }

    throw error
  }
})

devicePairingRoutes.get('/registrations/:deviceId', async (c) => {
  const deviceId = c.req.param('deviceId').trim()
  if (!deviceId || deviceId.length > 128) {
    return c.json({ paired: false }, 400)
  }

  const device = await prisma.device.findFirst({
    where: { deviceId, deletedAt: null },
    select: { id: true },
  })

  return c.json({ paired: Boolean(device) })
})
