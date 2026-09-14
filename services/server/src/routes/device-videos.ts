import { Hono, type Context } from 'hono'
import { z } from 'zod/v4'
import { prisma } from '@virtality/db'
import {
  DeviceVideoRouteError,
  invalidRequestError,
} from '../lib/device-video-errors.ts'
import { getDownloadDescriptor } from '../lib/download-descriptor.ts'

const DeviceIdQuerySchema = z.string().trim().min(1).max(128)
const VideoIdParamSchema = z.string().min(1)

export const deviceVideoRoutes = new Hono()

deviceVideoRoutes.use('*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store')
})

function jsonError(c: Context, error: DeviceVideoRouteError) {
  return c.json({ error: error.code, message: error.message }, error.status)
}

function catchDeviceVideoError(c: Context, error: unknown) {
  if (error instanceof DeviceVideoRouteError) {
    return jsonError(c, error)
  }
  throw error
}

deviceVideoRoutes.get('/:videoId', async (c) => {
  const videoIdParsed = VideoIdParamSchema.safeParse(c.req.param('videoId'))
  const deviceIdParsed = DeviceIdQuerySchema.safeParse(c.req.query('deviceId'))

  if (!videoIdParsed.success || !deviceIdParsed.success) {
    return jsonError(c, invalidRequestError('Invalid download request.'))
  }

  try {
    const descriptor = await getDownloadDescriptor(prisma, {
      deviceId: deviceIdParsed.data,
      videoId: videoIdParsed.data,
    })
    return c.json(descriptor)
  } catch (error) {
    return catchDeviceVideoError(c, error)
  }
})
