import { useMutation } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type CreatePatientProgramOnSuccess = ReturnType<
  ORPCUtils['legacy']['program']['create']['mutationOptions']
>['onSuccess']

interface UseCreateProgramProps {
  onSuccess?: CreatePatientProgramOnSuccess
}

export function useCreateProgram({ onSuccess }: UseCreateProgramProps = {}) {
  const orpc = useORPC()
  return useMutation(orpc.legacy.program.create.mutationOptions({ onSuccess }))
}
