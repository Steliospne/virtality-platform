import { ORPCError } from '@orpc/server'
import {
  loadConsolePromoRedeemPreflightAction,
  readConsoleSubscriptionDiscountAction,
  redeemPromotionCodeAction,
  removePromoDiscountAction,
} from '@virtality/auth'
import { redeemPromotionCodeInputSchema } from '@virtality/shared/types'
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
  remove,
}
