import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { ORPCUtils } from '../../../orpc.ts'

type UseApprovePendingAccountDeletionProps = ReturnType<
  ORPCUtils['pendingAccountDeletion']['approve']['mutationOptions']
>

type ApprovePendingAccountDeletionInput = {
  token: string
}

type ApprovePendingAccountDeletionResult = {
  approved: true
}

export function useApprovePendingAccountDeletion(
  props?: UseApprovePendingAccountDeletionProps,
): UseMutationResult<
  ApprovePendingAccountDeletionResult,
  Error,
  ApprovePendingAccountDeletionInput
> {
  const orpc = useORPC()
  return useMutation(
    orpc.pendingAccountDeletion.approve.mutationOptions({ ...props }),
  )
}
