import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type UpdateProgramExercisesOnSuccess = ReturnType<
  typeof orpc.programExercise.updateMany.mutationOptions
>['onSuccess']

interface useUpdateProgramExercisesProps {
  onSuccess?: UpdateProgramExercisesOnSuccess
}

const useUpdateProgramExercises = ({
  onSuccess,
}: useUpdateProgramExercisesProps) => {
  return useMutation(
    orpc.programExercise.updateMany.mutationOptions({ onSuccess }),
  )
}

export default useUpdateProgramExercises
