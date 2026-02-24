'use client'
import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type UpdatePatientOnSuccess = ReturnType<
  typeof orpc.patient.update.mutationOptions
>['onSuccess']

interface useUpdatePatientProps {
  onSuccess?: UpdatePatientOnSuccess
}

const useUpdatePatient = ({ onSuccess }: useUpdatePatientProps) => {
  return useMutation(
    orpc.patient.update.mutationOptions({
      onSuccess,
    }),
  )
}

export default useUpdatePatient
