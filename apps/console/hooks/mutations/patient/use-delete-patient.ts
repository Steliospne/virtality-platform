'use client'
import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type DeletePatientOnSuccess = ReturnType<
  typeof orpc.patient.delete.mutationOptions
>['onSuccess']

interface useDeletePatientProps {
  onSuccess?: DeletePatientOnSuccess
}

const useDeletePatient = ({ onSuccess }: useDeletePatientProps) => {
  return useMutation(
    orpc.patient.delete.mutationOptions({
      onSuccess,
    }),
  )
}

export default useDeletePatient
