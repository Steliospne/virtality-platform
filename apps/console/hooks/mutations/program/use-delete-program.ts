'use client'

import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type DeletePatientProgramOnSuccess = ReturnType<
  typeof orpc.program.delete.mutationOptions
>['onSuccess']

interface useDeletePatientProgramProps {
  onSuccess?: DeletePatientProgramOnSuccess
}

const useDeletePatientProgram = ({
  onSuccess,
}: useDeletePatientProgramProps) => {
  return useMutation(orpc.program.delete.mutationOptions({ onSuccess }))
}

export default useDeletePatientProgram
