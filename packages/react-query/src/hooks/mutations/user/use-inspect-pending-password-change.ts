import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { ORPCUtils } from '../../../orpc.ts'

type UseInspectPendingPasswordChangeProps = ReturnType<
  ORPCUtils['pendingPasswordChange']['inspect']['mutationOptions']
>

type InspectPendingPasswordChangeInput = {
  token: string
}

type InspectPendingPasswordChangeResult =
  | { valid: true; kind: 'SETUP' | 'CHANGE' }
  | { valid: false; canReturnToProfile: boolean }

export function useInspectPendingPasswordChange(
  props?: UseInspectPendingPasswordChangeProps,
): UseMutationResult<
  InspectPendingPasswordChangeResult,
  Error,
  InspectPendingPasswordChangeInput
> {
  const orpc = useORPC()
  return useMutation(
    orpc.pendingPasswordChange.inspect.mutationOptions({ ...props }),
  )
}
