'use client'

import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type UpdatePatientSessionOnSuccess = ReturnType<
  typeof orpc.patientSession.update.mutationOptions
>['onSuccess']

interface useUpdatePatientSessionProps {
  onSuccess?: UpdatePatientSessionOnSuccess
}

const useUpdatePatientSession = ({
  onSuccess,
}: useUpdatePatientSessionProps) => {
  return useMutation(orpc.patientSession.update.mutationOptions({ onSuccess }))
}

export default useUpdatePatientSession
