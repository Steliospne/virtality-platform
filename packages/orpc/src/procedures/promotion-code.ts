import { ORPCError } from '@orpc/server'
import {
  createPromotionCodeForAdminboard,
  deactivatePromotionCodeForAdminboard,
  listPromotionCodesForCouponForAdminboard,
  notifyPromotionCodeDeliveryForAdminboard,
  sendPromotionCodeEmailForAdminboard,
} from '@virtality/auth'
import type { PrismaClient } from '@virtality/db'
import { sendPromotionCodeEmail as deliverPromotionCodeEmail } from '@virtality/nodemailer'
import { getConsoleUrl } from '@virtality/shared/types'
import {
  CouponLibraryNotFoundError,
  PromotionCodeNotFoundError,
  PromotionCodeNotShareableError,
  PromotionCodeValidationError,
  type PromotionCodeDeliveryStore,
} from '@virtality/shared/utils'
import { z } from 'zod/v4'
import { authed } from '../middleware/auth.ts'

const couponIdInputSchema = z.object({
  couponId: z.string().trim().min(1),
})

const createInputSchema = z.object({
  couponId: z.string().trim().min(1),
  code: z.string().trim().max(50).nullable().optional(),
  expiresAt: z.number().int().positive().nullable().optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
})

const idInputSchema = z.object({
  id: z.string().trim().min(1),
})

const sendEmailInputSchema = z.object({
  id: z.string().trim().min(1),
  recipientEmail: z.string().trim().email(),
})

const notifyInputSchema = z.object({
  promotionCodeId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
})

export function createPrismaPromotionCodeDeliveryStore(
  prisma: PrismaClient,
): PromotionCodeDeliveryStore {
  return {
    findUserById: (userId) =>
      prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { id: true },
      }),
    upsertOpen: (data) =>
      prisma.promotionCodeDelivery.upsert({
        where: {
          userId_promotionCodeId: {
            userId: data.userId,
            promotionCodeId: data.promotionCodeId,
          },
        },
        create: {
          userId: data.userId,
          promotionCodeId: data.promotionCodeId,
          code: data.code,
          couponId: data.couponId,
          status: 'open',
          createdAt: data.now,
          updatedAt: data.now,
        },
        update: {
          code: data.code,
          couponId: data.couponId,
          status: 'open',
          updatedAt: data.now,
        },
      }),
  }
}

function throwPromotionCodeOrpcError(error: unknown): never {
  if (
    error instanceof PromotionCodeValidationError ||
    error instanceof PromotionCodeNotShareableError
  ) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }
  if (
    error instanceof PromotionCodeNotFoundError ||
    error instanceof CouponLibraryNotFoundError
  ) {
    throw new ORPCError('NOT_FOUND', { message: error.message })
  }
  if (error instanceof Error) {
    throw new ORPCError('BAD_REQUEST', {
      message: `Promotion Code failed: ${error.message}`,
    })
  }
  throw error
}

async function runPromotionCodeHandler<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    throwPromotionCodeOrpcError(error)
  }
}

const list = authed
  .route({ path: '/promotion-code/list', method: 'GET' })
  .input(couponIdInputSchema)
  .handler(async ({ input }) =>
    runPromotionCodeHandler(() =>
      listPromotionCodesForCouponForAdminboard(input.couponId),
    ),
  )

const create = authed
  .route({ path: '/promotion-code/create', method: 'POST' })
  .input(createInputSchema)
  .handler(async ({ input }) =>
    runPromotionCodeHandler(() => createPromotionCodeForAdminboard(input)),
  )

const deactivate = authed
  .route({ path: '/promotion-code/deactivate', method: 'POST' })
  .input(idInputSchema)
  .handler(async ({ input }) =>
    runPromotionCodeHandler(() =>
      deactivatePromotionCodeForAdminboard(input.id),
    ),
  )

const sendEmail = authed
  .route({ path: '/promotion-code/send-email', method: 'POST' })
  .input(sendEmailInputSchema)
  .handler(async ({ input }) =>
    runPromotionCodeHandler(() =>
      sendPromotionCodeEmailForAdminboard(input, {
        billingUrl: `${getConsoleUrl()}/`,
        deliver: async (payload) => {
          await deliverPromotionCodeEmail(payload)
        },
      }),
    ),
  )

const notifyInApp = authed
  .route({ path: '/promotion-code/notify-in-app', method: 'POST' })
  .input(notifyInputSchema)
  .handler(async ({ context, input }) =>
    runPromotionCodeHandler(() =>
      notifyPromotionCodeDeliveryForAdminboard(
        createPrismaPromotionCodeDeliveryStore(context.prisma),
        input,
      ),
    ),
  )

export const promotionCode = {
  list,
  create,
  deactivate,
  sendEmail,
  notifyInApp,
}
