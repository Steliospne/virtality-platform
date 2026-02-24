import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type CreatePatientSessionExercisesOnSuccess = ReturnType<
  typeof orpc.patientSessionExercise.createMany.mutationOptions
>['onSuccess']

interface useCreatePatientSessionExercisesProps {
  onSuccess?: CreatePatientSessionExercisesOnSuccess
}

const useCreatePatientSessionExercises = ({
  onSuccess,
}: useCreatePatientSessionExercisesProps) => {
  return useMutation(
    orpc.patientSessionExercise.createMany.mutationOptions({
      onSuccess,
    }),
  )
}

export default useCreatePatientSessionExercises
