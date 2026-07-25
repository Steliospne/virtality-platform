import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import { assignPromoVideoInputSchema } from '@virtality/shared/types'
import {
  assignPromoVideo,
  clearPromoVideo,
  getPromoVideo,
  PromoVideoValidationError,
  PROMO_VIDEO_SINGLETON_ID,
  type PromoVideoStore,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'
import { base, bustWebsiteMarketingCache } from '../context.ts'

function createPrismaPromoVideoStore(prisma: PrismaClient): PromoVideoStore {
  return {
    findSingleton: () =>
      prisma.marketingPromoVideo.findUnique({
        where: { id: PROMO_VIDEO_SINGLETON_ID },
      }),
    create: (data) => prisma.marketingPromoVideo.create({ data }),
    update: (id, data) =>
      prisma.marketingPromoVideo.update({
        where: { id },
        data,
      }),
    deleteAll: async () => {
      await prisma.marketingPromoVideo.deleteMany()
    },
  }
}

function throwPromoVideoOrpcError(error: unknown): never {
  if (error instanceof PromoVideoValidationError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }

  throw error
}

async function withPromoVideoStore<T>(
  prisma: PrismaClient,
  operation: (store: PromoVideoStore) => Promise<T>,
): Promise<T> {
  try {
    return await operation(createPrismaPromoVideoStore(prisma))
  } catch (error) {
    throwPromoVideoOrpcError(error)
  }
}

const getPromoVideoProcedure = base
  .route({ path: '/promo-video/get', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma } = context
    return getPromoVideo(createPrismaPromoVideoStore(prisma))
  })

const assignPromoVideoProcedure = authed
  .route({ path: '/promo-video/assign', method: 'POST' })
  .input(assignPromoVideoInputSchema)
  .handler(async ({ context, input }) => {
    const result = await withPromoVideoStore(context.prisma, (store) =>
      assignPromoVideo(store, input),
    )
    await bustWebsiteMarketingCache(context, { tag: 'promo-video' })
    return result
  })

const clearPromoVideoProcedure = authed
  .route({ path: '/promo-video/clear', method: 'DELETE' })
  .handler(async ({ context }) => {
    const result = await withPromoVideoStore(context.prisma, (store) =>
      clearPromoVideo(store),
    )
    await bustWebsiteMarketingCache(context, { tag: 'promo-video' })
    return result
  })

export const promoVideo = {
  get: getPromoVideoProcedure,
  assign: assignPromoVideoProcedure,
  clear: clearPromoVideoProcedure,
}
