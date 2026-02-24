import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type ProgramExerciseOnSuccess = ReturnType<
  typeof orpc.programExercise.createMany.mutationOptions
>['onSuccess']

interface useCreateProgramExercisesProps {
  onSuccess?: ProgramExerciseOnSuccess
}

const useCreateProgramExercises = ({
  onSuccess,
}: useCreateProgramExercisesProps) => {
  return useMutation(
    orpc.programExercise.createMany.mutationOptions({ onSuccess }),
  )
}

export default useCreateProgramExercises
