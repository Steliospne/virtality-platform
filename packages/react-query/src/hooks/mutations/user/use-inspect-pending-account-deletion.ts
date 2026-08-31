import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { ORPCUtils } from '../../../orpc.ts'

type UseInspectPendingAccountDeletionProps = ReturnType<
  ORPCUtils['pendingAccountDeletion']['inspect']['mutationOptions']
>

type InspectPendingAccountDeletionInput = {
  token: string
}

type InspectPendingAccountDeletionResult =
  | { valid: true }
  | { valid: false; canReturnToProfile: boolean }

export function useInspectPendingAccountDeletion(
  props?: UseInspectPendingAccountDeletionProps,
): UseMutationResult<
  InspectPendingAccountDeletionResult,
  Error,
  InspectPendingAccountDeletionInput
> {
  const orpc = useORPC()
  return useMutation(
    orpc.pendingAccountDeletion.inspect.mutationOptions({ ...props }),
  )
}
