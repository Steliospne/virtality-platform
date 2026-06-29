import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { ORPCUtils } from '../../../orpc.ts'

type UseStartPasswordChangeProps = ReturnType<
  ORPCUtils['pendingPasswordChange']['startChange']['mutationOptions']
>

type StartPasswordChangeInput = {
  currentPassword: string
  newPassword: string
}

type StartPasswordChangeResult = {
  destinationEmail: string
  expiresAt: Date
}

export function useStartPasswordChange(
  props?: UseStartPasswordChangeProps,
): UseMutationResult<
  StartPasswordChangeResult,
  Error,
  StartPasswordChangeInput
> {
  const orpc = useORPC()
  return useMutation(
    orpc.pendingPasswordChange.startChange.mutationOptions({ ...props }),
  )
}
