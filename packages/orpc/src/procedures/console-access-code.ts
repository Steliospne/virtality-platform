import { ORPCError } from '@orpc/server'
import { redeemAccessCodeAction } from '@virtality/auth'
import { redeemAccessCodeInputSchema } from '@virtality/shared/types'
import {
  ConsoleAccessCodeAlreadyUsedError,
  ConsoleAccessCodeExpiredError,
  ConsoleAccessCodeFailedError,
  ConsoleAccessCodeInvalidError,
  ConsoleAccessCodeMissingCustomerError,
  ConsoleAccessCodeValidationError,
  ConsoleAccessCodeVariantBlockedError,
  ConsoleAccessCodeVariantUnavailableError,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'

const CONSOLE_ACCESS_CODE_CLIENT_ERRORS = [
  ConsoleAccessCodeValidationError,
  ConsoleAccessCodeInvalidError,
  ConsoleAccessCodeExpiredError,
  ConsoleAccessCodeAlreadyUsedError,
  ConsoleAccessCodeMissingCustomerError,
  ConsoleAccessCodeFailedError,
  ConsoleAccessCodeVariantBlockedError,
  ConsoleAccessCodeVariantUnavailableError,
] as const

function throwConsoleAccessCodeOrpcError(error: unknown): never {
  for (const ErrorClass of CONSOLE_ACCESS_CODE_CLIENT_ERRORS) {
    if (error instanceof ErrorClass) {
      throw new ORPCError('BAD_REQUEST', { message: error.message })
    }
  }
  if (error instanceof Error) {
    throw new ORPCError('BAD_REQUEST', {
      message: `Access Code redeem failed: ${error.message}`,
    })
  }
  throw error
}

async function runConsoleAccessCodeHandler<T>(
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run()
  } catch (error) {
    throwConsoleAccessCodeOrpcError(error)
  }
}

const redeem = authed
  .route({ path: '/console-access-code/redeem', method: 'POST' })
  .input(redeemAccessCodeInputSchema)
  .handler(async ({ context, input }) =>
    runConsoleAccessCodeHandler(() =>
      redeemAccessCodeAction({
        userId: context.user.id,
        code: input.code,
      }),
    ),
  )

export const consoleAccessCode = {
  redeem,
}
