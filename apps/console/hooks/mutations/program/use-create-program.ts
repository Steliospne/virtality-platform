'use client'

import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type CreatePatientProgramOnSuccess = ReturnType<
  typeof orpc.program.create.mutationOptions
>['onSuccess']

interface useCreateProgramProps {
  onSuccess?: CreatePatientProgramOnSuccess
}

const useCreateProgram = ({ onSuccess }: useCreateProgramProps) => {
  return useMutation(orpc.program.create.mutationOptions({ onSuccess }))
}

export default useCreateProgram
