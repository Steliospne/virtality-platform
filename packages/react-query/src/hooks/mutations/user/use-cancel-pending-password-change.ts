import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { ORPCUtils } from '../../../orpc.ts'

type UseCancelPendingPasswordChangeProps = ReturnType<
  ORPCUtils['pendingPasswordChange']['cancel']['mutationOptions']
>

type CancelPendingPasswordChangeResult = {
  cancelled: true
}

export function useCancelPendingPasswordChange(
  props?: UseCancelPendingPasswordChangeProps,
): UseMutationResult<CancelPendingPasswordChangeResult, Error, unknown> {
  const orpc = useORPC()
  return useMutation(
    orpc.pendingPasswordChange.cancel.mutationOptions({ ...props }),
  )
}
