import { prisma } from '@virtality/db'

export const findDeviceByDeviceId = async (deviceId: string) => {
  const device = await prisma.device.findFirst({
    where: { deviceId, AND: [{ deletedAt: null }] },
  })
  return device
}
