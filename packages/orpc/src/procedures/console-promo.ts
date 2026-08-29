import { ORPCError } from '@orpc/server'
import {
  cancelPendingPromotionCodeAction,
  loadConsolePromoRedeemPreflightAction,
  readConsoleSubscriptionDiscountAction,
  readOpenPendingPromotionCodeAction,
  redeemPromotionCodeAction,
  removePromoDiscountAction,
  savePendingPromotionCodeAction,
} from '@virtality/auth'
import {
  redeemPromotionCodeInputSchema,
  savePendingPromotionCodeInputSchema,
  type OpenPendingPromotionCodeHold,
} from '@virtality/shared/types'
import {
  ConsolePromoConfirmRequiredError,
  ConsolePromoCouponUnavailableError,
  ConsolePromoInvalidCodeError,
  ConsolePromoNoEligibleSubscriptionError,
  ConsolePromoNotPromoError,
  ConsolePromoReadFailedError,
  ConsolePromoStaffBlockedError,
  ConsolePromoValidationError,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'

const CONSOLE_PROMO_CLIENT_ERRORS = [
  ConsolePromoValidationError,
  ConsolePromoNoEligibleSubscriptionError,
  ConsolePromoStaffBlockedError,
  ConsolePromoConfirmRequiredError,
  ConsolePromoInvalidCodeError,
  ConsolePromoCouponUnavailableError,
  ConsolePromoReadFailedError,
  ConsolePromoNotPromoError,
] as const

function throwConsolePromoOrpcError(error: unknown): never {
  for (const ErrorClass of CONSOLE_PROMO_CLIENT_ERRORS) {
    if (error instanceof ErrorClass) {
      throw new ORPCError('BAD_REQUEST', { message: error.message })
    }
  }
  if (error instanceof Error) {
    throw new ORPCError('BAD_REQUEST', {
      message: `Promotion Code redeem failed: ${error.message}`,
    })
  }
  throw error
}

async function runConsolePromoHandler<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    throwConsolePromoOrpcError(error)
  }
}

const readDiscount = authed
  .route({ path: '/console-promo/read-discount', method: 'GET' })
  .handler(async ({ context }) =>
    runConsolePromoHandler(() =>
      readConsoleSubscriptionDiscountAction(context.user.id),
    ),
  )

const redeemPreflight = authed
  .route({ path: '/console-promo/redeem-preflight', method: 'GET' })
  .handler(async ({ context }) =>
    runConsolePromoHandler(() =>
      loadConsolePromoRedeemPreflightAction(context.user.id),
    ),
  )

const redeem = authed
  .route({ path: '/console-promo/redeem', method: 'POST' })
  .input(redeemPromotionCodeInputSchema)
  .handler(async ({ context, input }) =>
    runConsolePromoHandler(() =>
      redeemPromotionCodeAction({
        userId: context.user.id,
        code: input.code,
        confirmReplace: input.confirmReplace,
      }),
    ),
  )

const savePending = authed
  .route({ path: '/console-promo/pending', method: 'POST' })
  .input(savePendingPromotionCodeInputSchema)
  .handler(async ({ context, input }) =>
    runConsolePromoHandler(() =>
      savePendingPromotionCodeAction({
        userId: context.user.id,
        code: input.code,
      }),
    ),
  )

const readPending = authed
  .route({ path: '/console-promo/pending', method: 'GET' })
  .handler(
    async ({ context }): Promise<OpenPendingPromotionCodeHold | null> =>
      runConsolePromoHandler(() =>
        readOpenPendingPromotionCodeAction({ userId: context.user.id }),
      ),
  )

const cancelPending = authed
  .route({ path: '/console-promo/pending/cancel', method: 'POST' })
  .handler(async ({ context }) =>
    runConsolePromoHandler(() =>
      cancelPendingPromotionCodeAction({ userId: context.user.id }),
    ),
  )

const remove = authed
  .route({ path: '/console-promo/remove', method: 'POST' })
  .handler(async ({ context }) =>
    runConsolePromoHandler(() =>
      removePromoDiscountAction({ userId: context.user.id }),
    ),
  )

export const consolePromo = {
  readDiscount,
  redeemPreflight,
  redeem,
  readPending,
  savePending,
  cancelPending,
  remove,
}
