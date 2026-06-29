import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { ORPCUtils } from '../../../orpc.ts'

type UseResendPendingPasswordChangeProps = ReturnType<
  ORPCUtils['pendingPasswordChange']['resend']['mutationOptions']
>

type ResendPendingPasswordChangeResult = {
  destinationEmail: string
  expiresAt: Date
}

export function useResendPendingPasswordChange(
  props?: UseResendPendingPasswordChangeProps,
): UseMutationResult<ResendPendingPasswordChangeResult, Error, unknown> {
  const orpc = useORPC()
  return useMutation(
    orpc.pendingPasswordChange.resend.mutationOptions({ ...props }),
  )
}
