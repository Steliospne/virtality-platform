import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type PresetExerciseOnSuccess = ReturnType<
  typeof orpc.presetExercise.createMany.mutationOptions
>['onSuccess']

interface useCreatePresetExercisesProps {
  onSuccess?: PresetExerciseOnSuccess
}

const useCreatePresetExercises = ({
  onSuccess,
}: useCreatePresetExercisesProps) => {
  return useMutation(
    orpc.presetExercise.createMany.mutationOptions({ onSuccess }),
  )
}

export default useCreatePresetExercises
