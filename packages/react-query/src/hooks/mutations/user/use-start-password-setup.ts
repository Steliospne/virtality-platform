import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { ORPCUtils } from '../../../orpc.ts'

type UseStartPasswordSetupProps = ReturnType<
  ORPCUtils['pendingPasswordChange']['startSetup']['mutationOptions']
>

type StartPasswordSetupInput = {
  newPassword: string
}

type StartPasswordSetupResult = {
  destinationEmail: string
  expiresAt: Date
}

export function useStartPasswordSetup(
  props?: UseStartPasswordSetupProps,
): UseMutationResult<StartPasswordSetupResult, Error, StartPasswordSetupInput> {
  const orpc = useORPC()
  return useMutation(
    orpc.pendingPasswordChange.startSetup.mutationOptions({ ...props }),
  )
}
