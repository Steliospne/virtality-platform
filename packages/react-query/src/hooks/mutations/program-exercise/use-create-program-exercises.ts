import { useMutation } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type ProgramExerciseOnSuccess = ReturnType<
  ORPCUtils['legacy']['programExercise']['createMany']['mutationOptions']
>['onSuccess']

interface UseCreateProgramExercisesProps {
  onSuccess?: ProgramExerciseOnSuccess
}

export function useCreateProgramExercises({
  onSuccess,
}: UseCreateProgramExercisesProps = {}) {
  const orpc = useORPC()
  return useMutation(
    orpc.legacy.programExercise.createMany.mutationOptions({ onSuccess }),
  )
}
