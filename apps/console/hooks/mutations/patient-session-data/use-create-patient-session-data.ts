import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type CreatePatientSessionDataOnSuccess = ReturnType<
  typeof orpc.patientSessionData.create.mutationOptions
>

interface useCreatePatientSessionDataProps {
  onSuccess?: CreatePatientSessionDataOnSuccess['onSuccess']
}

const useCreatePatientSessionData = ({
  onSuccess,
}: useCreatePatientSessionDataProps) => {
  return useMutation(
    orpc.patientSessionData.create.mutationOptions({
      onSuccess,
    }),
  )
}

export default useCreatePatientSessionData
