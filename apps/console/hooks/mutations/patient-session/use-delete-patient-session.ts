'use client'

import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type DeletePatientSessionOnSuccess = ReturnType<
  typeof orpc.patientSession.delete.mutationOptions
>['onSuccess']

interface useDeletePatientSessionProps {
  onSuccess?: DeletePatientSessionOnSuccess
}

const useDeletePatientSession = ({
  onSuccess,
}: useDeletePatientSessionProps) => {
  return useMutation(orpc.patientSession.delete.mutationOptions({ onSuccess }))
}

export default useDeletePatientSession
