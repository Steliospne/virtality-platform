import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { ORPCUtils } from '../../../orpc.ts'

type UseStartAccountDeletionProps = ReturnType<
  ORPCUtils['pendingAccountDeletion']['start']['mutationOptions']
>

type StartAccountDeletionResult = {
  destinationEmail: string
  expiresAt: Date
}

export function useStartAccountDeletion(
  props?: UseStartAccountDeletionProps,
): UseMutationResult<StartAccountDeletionResult, Error, unknown> {
  const orpc = useORPC()
  return useMutation(
    orpc.pendingAccountDeletion.start.mutationOptions({ ...props }),
  )
}
