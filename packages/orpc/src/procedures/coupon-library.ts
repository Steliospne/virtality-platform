import { ORPCError } from '@orpc/server'
import {
  archiveLibraryCouponForAdminboard,
  createLibraryCouponForAdminboard,
  deleteLibraryCouponForAdminboard,
  listLibraryCouponsForAdminboard,
  updateLibraryCouponNameForAdminboard,
} from '@virtality/auth'
import {
  COUPON_DURATIONS,
  CouponLibraryNotFoundError,
  CouponLibraryValidationError,
} from '@virtality/shared/utils'
import { z } from 'zod/v4'
import { authed } from '../middleware/auth.ts'

const createInputSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    percentOff: z.number().positive().max(100).optional(),
    amountOff: z.number().int().positive().optional(),
    duration: z.enum(COUPON_DURATIONS),
    durationInMonths: z.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    const hasPercent = value.percentOff !== undefined
    const hasAmount = value.amountOff !== undefined
    if (hasPercent === hasAmount) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide either percentOff or amountOff, not both',
        path: hasPercent && hasAmount ? ['amountOff'] : ['percentOff'],
      })
    }
    if (
      value.duration === 'repeating' &&
      value.durationInMonths === undefined
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'durationInMonths is required for repeating Coupons',
        path: ['durationInMonths'],
      })
    }
  })

const updateNameInputSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(40),
})

const idInputSchema = z.object({
  id: z.string().trim().min(1),
})

function throwCouponLibraryOrpcError(error: unknown): never {
  if (error instanceof CouponLibraryValidationError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }
  if (error instanceof CouponLibraryNotFoundError) {
    throw new ORPCError('NOT_FOUND', { message: error.message })
  }
  if (error instanceof Error) {
    throw new ORPCError('BAD_REQUEST', {
      message: `Coupon library failed: ${error.message}`,
    })
  }
  throw error
}

async function runCouponLibraryHandler<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    throwCouponLibraryOrpcError(error)
  }
}

const list = authed
  .route({ path: '/coupon-library/list', method: 'GET' })
  .handler(async () =>
    runCouponLibraryHandler(() => listLibraryCouponsForAdminboard()),
  )

const create = authed
  .route({ path: '/coupon-library/create', method: 'POST' })
  .input(createInputSchema)
  .handler(async ({ input }) =>
    runCouponLibraryHandler(() => createLibraryCouponForAdminboard(input)),
  )

const updateName = authed
  .route({ path: '/coupon-library/update-name', method: 'POST' })
  .input(updateNameInputSchema)
  .handler(async ({ input }) =>
    runCouponLibraryHandler(() => updateLibraryCouponNameForAdminboard(input)),
  )

const archive = authed
  .route({ path: '/coupon-library/archive', method: 'POST' })
  .input(idInputSchema)
  .handler(async ({ input }) =>
    runCouponLibraryHandler(() => archiveLibraryCouponForAdminboard(input.id)),
  )

const deleteProcedure = authed
  .route({ path: '/coupon-library/delete', method: 'DELETE' })
  .input(idInputSchema)
  .handler(async ({ input }) => {
    await runCouponLibraryHandler(() =>
      deleteLibraryCouponForAdminboard(input.id),
    )
  })

export const couponLibrary = {
  list,
  create,
  updateName,
  archive,
  delete: deleteProcedure,
}
