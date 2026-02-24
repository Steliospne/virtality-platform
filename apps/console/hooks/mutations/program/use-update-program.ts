'use client'

import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type UpdatePatientProgramOnSuccess = ReturnType<
  typeof orpc.program.update.mutationOptions
>['onSuccess']

interface useUpdatePatientProgramProps {
  onSuccess?: UpdatePatientProgramOnSuccess
}

const useUpdatePatientProgram = ({
  onSuccess,
}: useUpdatePatientProgramProps) => {
  return useMutation(orpc.program.update.mutationOptions({ onSuccess }))
}

export default useUpdatePatientProgram
