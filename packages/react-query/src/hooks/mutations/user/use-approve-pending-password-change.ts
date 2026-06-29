import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { ORPCUtils } from '../../../orpc.ts'

type UseApprovePendingPasswordChangeProps = ReturnType<
  ORPCUtils['pendingPasswordChange']['approve']['mutationOptions']
>

type ApprovePendingPasswordChangeInput = {
  token: string
}

type ApprovePendingPasswordChangeResult = {
  approved: true
}

export function useApprovePendingPasswordChange(
  props?: UseApprovePendingPasswordChangeProps,
): UseMutationResult<
  ApprovePendingPasswordChangeResult,
  Error,
  ApprovePendingPasswordChangeInput
> {
  const orpc = useORPC()
  return useMutation(
    orpc.pendingPasswordChange.approve.mutationOptions({ ...props }),
  )
}
