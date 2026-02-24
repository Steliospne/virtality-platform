import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type CreatePatientSessionOnSuccess = ReturnType<
  typeof orpc.patientSession.create.mutationOptions
>['onSuccess']

interface useCreatePatientSessionProps {
  onSuccess?: CreatePatientSessionOnSuccess
}

const useCreatePatientSession = ({
  onSuccess,
}: useCreatePatientSessionProps) => {
  return useMutation(orpc.patientSession.create.mutationOptions({ onSuccess }))
}

export default useCreatePatientSession
