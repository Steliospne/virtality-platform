import { DeviceSchema } from '@virtality/db/definitions'
import { ORPCError } from '@orpc/server'
import { authed } from '../middleware/auth.ts'
import { base } from '../context.ts'

const listDevice = authed
  .route({ path: '/device/list', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma, user } = context
    const devices = await prisma.device.findMany({
      where: { userId: user.id, AND: [{ deletedAt: null }] },
    })
    return devices
  })

const findDevice = authed
  .route({ path: '/device/find', method: 'GET' })
  .input(DeviceSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma, user } = context
    const device = await prisma.device.findFirst({
      where: { id: input.id, userId: user.id, deletedAt: null },
    })
    return device
  })

const findDeviceByDeviceId = base
  .route({ path: '/device/find-by-device-id', method: 'GET' })
  .input(DeviceSchema.pick({ deviceId: true }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const device = await prisma.device.findFirst({
      where: { deviceId: input.deviceId, AND: [{ deletedAt: null }] },
    })
    return device
  })

const createDevice = authed
  .route({ path: '/device/create', method: 'POST' })
  .input(DeviceSchema.omit({ userId: true }))
  .handler(async ({ context, input }) => {
    const { prisma, user } = context
    const device = await prisma.device.create({
      data: { ...input, userId: user.id },
    })
    return device
  })

const deleteDevice = authed
  .route({ path: '/device/delete', method: 'DELETE' })
  .input(DeviceSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma, user } = context
    const exists = await prisma.device.findFirst({
      where: { id: input.id, userId: user.id, deletedAt: null },
      select: { id: true },
    })
    if (!exists) {
      throw new ORPCError('NOT_FOUND', { message: 'Device not found.' })
    }

    const now = new Date()
    const device = await prisma.$transaction(async (tx) => {
      await tx.devicePairingAttempt.updateMany({
        where: { deviceRecordId: input.id, status: 'PENDING' },
        data: {
          status: 'CANCELLED',
          activeCode: null,
          activeDeviceKey: null,
          cancelledAt: now,
        },
      })

      return tx.device.update({
        data: { deletedAt: now, deviceId: null },
        where: { id: input.id },
      })
    })

    return device
  })

const resetDeviceId = authed
  .route({ path: '/device/reset-device-id', method: 'POST' })
  .input(DeviceSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma, user } = context
    const exists = await prisma.device.findFirst({
      where: { id: input.id, userId: user.id, deletedAt: null },
      select: { id: true },
    })
    if (!exists) {
      throw new ORPCError('NOT_FOUND', { message: 'Device not found.' })
    }

    const now = new Date()
    const device = await prisma.$transaction(async (tx) => {
      await tx.devicePairingAttempt.updateMany({
        where: { deviceRecordId: input.id, status: 'PENDING' },
        data: {
          status: 'CANCELLED',
          activeCode: null,
          activeDeviceKey: null,
          cancelledAt: now,
        },
      })

      return tx.device.update({
        data: { deviceId: null },
        where: { id: input.id },
      })
    })
    return device
  })

export const device = {
  list: listDevice,
  find: findDevice,
  delete: deleteDevice,
  resetDeviceId: resetDeviceId,
  create: createDevice,
  findByDeviceId: findDeviceByDeviceId,
}
