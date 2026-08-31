import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { ORPCUtils } from '../../../orpc.ts'

type UseResendPendingAccountDeletionProps = ReturnType<
  ORPCUtils['pendingAccountDeletion']['resend']['mutationOptions']
>

type ResendPendingAccountDeletionResult = {
  destinationEmail: string
  expiresAt: Date
}

export function useResendPendingAccountDeletion(
  props?: UseResendPendingAccountDeletionProps,
): UseMutationResult<ResendPendingAccountDeletionResult, Error, unknown> {
  const orpc = useORPC()
  return useMutation(
    orpc.pendingAccountDeletion.resend.mutationOptions({ ...props }),
  )
}
