import { DeviceSchema } from '@virtality/db/definitions'
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
    const { prisma } = context
    console.log(context.user)
    const device = await prisma.device.findUnique({
      where: { id: input.id, AND: [{ deletedAt: null }] },
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
    const { prisma } = context
    const exists = await prisma.device.findUnique({
      where: { id: input.id, AND: [{ deletedAt: null }] },
    })
    if (!exists) {
      throw new Error('Device not found')
    }

    const device = await prisma.device.update({
      data: { deletedAt: new Date() },
      where: { id: input.id },
    })

    return device
  })

const setDeviceId = authed
  .route({ path: '/device/set-device-id', method: 'POST' })
  .input(DeviceSchema.pick({ id: true, deviceId: true }))
  .handler(async ({ context, input }) => {
    const { prisma, user } = context
    const exists = await prisma.device.findUnique({
      where: { id: input.id, AND: [{ deletedAt: null }] },
    })
    if (!exists) {
      throw new Error('Device not found')
    }
    const device = await prisma.device.update({
      data: { deviceId: input.deviceId },
      where: { id: input.id },
    })
    return device
  })

const resetDeviceId = authed
  .route({ path: '/device/reset-device-id', method: 'POST' })
  .input(DeviceSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const exists = await prisma.device.findUnique({
      where: { id: input.id, AND: [{ deletedAt: null }] },
    })
    if (!exists) {
      throw new Error('Device not found')
    }
    const device = await prisma.device.update({
      data: { deviceId: null },
      where: { id: input.id },
    })
    return device
  })

export const device = {
  list: listDevice,
  find: findDevice,
  delete: deleteDevice,
  setDeviceId: setDeviceId,
  resetDeviceId: resetDeviceId,
  create: createDevice,
  findByDeviceId: findDeviceByDeviceId,
}
