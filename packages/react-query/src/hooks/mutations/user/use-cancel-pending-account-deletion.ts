import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { ORPCUtils } from '../../../orpc.ts'

type UseCancelPendingAccountDeletionProps = ReturnType<
  ORPCUtils['pendingAccountDeletion']['cancel']['mutationOptions']
>

type CancelPendingAccountDeletionResult = {
  cancelled: true
}

export function useCancelPendingAccountDeletion(
  props?: UseCancelPendingAccountDeletionProps,
): UseMutationResult<CancelPendingAccountDeletionResult, Error, unknown> {
  const orpc = useORPC()
  return useMutation(
    orpc.pendingAccountDeletion.cancel.mutationOptions({ ...props }),
  )
}
