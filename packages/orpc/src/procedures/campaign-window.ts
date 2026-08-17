import { ORPCError } from '@orpc/server'
import {
  closeCampaignWindowAction,
  getCampaignWindowForAdminboard,
  listLibraryCouponsForAdminboard,
  saveCampaignWindowForAdminboard,
} from '@virtality/auth'
import {
  CampaignWindowValidationError,
  listCouponsForCampaignPicker,
  type CampaignWindowRecord,
} from '@virtality/shared/utils'
import { z } from 'zod/v4'
import { authed } from '../middleware/auth.ts'

const upsertInputSchema = z
  .object({
    couponId: z.string().trim().min(1),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .superRefine((value, ctx) => {
    if (value.endsAt.getTime() <= value.startsAt.getTime()) {
      ctx.addIssue({
        code: 'custom',
        message: 'endsAt must be after startsAt',
        path: ['endsAt'],
      })
    }
  })

function throwCampaignWindowOrpcError(error: unknown): never {
  if (error instanceof CampaignWindowValidationError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }
  if (error instanceof Error) {
    throw new ORPCError('BAD_REQUEST', {
      message: `Campaign Window failed: ${error.message}`,
    })
  }
  throw error
}

async function runCampaignWindowHandler<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    throwCampaignWindowOrpcError(error)
  }
}

function serializeWindow(window: CampaignWindowRecord | null) {
  if (!window) return null
  return {
    id: window.id,
    couponId: window.couponId,
    startsAt: window.startsAt.toISOString(),
    endsAt: window.endsAt.toISOString(),
    closedAt: window.closedAt?.toISOString() ?? null,
    createdAt: window.createdAt.toISOString(),
    updatedAt: window.updatedAt.toISOString(),
  }
}

const get = authed
  .route({ path: '/campaign-window/get', method: 'GET' })
  .handler(async () =>
    runCampaignWindowHandler(async () => {
      const view = await getCampaignWindowForAdminboard()
      return {
        window: serializeWindow(view.window),
        lifecycle: view.lifecycle,
        coupon: view.coupon,
        couponHealth: view.couponHealth,
        attaching: view.attaching,
      }
    }),
  )

const listPickerCoupons = authed
  .route({ path: '/campaign-window/picker-coupons', method: 'GET' })
  .handler(async () =>
    runCampaignWindowHandler(async () => {
      const coupons = await listLibraryCouponsForAdminboard()
      return listCouponsForCampaignPicker(coupons)
    }),
  )

const upsert = authed
  .route({ path: '/campaign-window/upsert', method: 'POST' })
  .input(upsertInputSchema)
  .handler(async ({ input }) =>
    runCampaignWindowHandler(async () => {
      const window = await saveCampaignWindowForAdminboard(input)
      return serializeWindow(window)
    }),
  )

const close = authed
  .route({ path: '/campaign-window/close', method: 'POST' })
  .handler(async () =>
    runCampaignWindowHandler(async () => {
      const window = await closeCampaignWindowAction()
      return serializeWindow(window)
    }),
  )

export const campaignWindow = {
  get,
  listPickerCoupons,
  upsert,
  close,
}
