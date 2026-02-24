import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type UpdatePresetExercisesOnSuccess = ReturnType<
  typeof orpc.presetExercise.updateMany.mutationOptions
>['onSuccess']

interface useUpdatePresetExercisesProps {
  onSuccess?: UpdatePresetExercisesOnSuccess
}

const useUpdatePresetExercises = ({
  onSuccess,
}: useUpdatePresetExercisesProps) => {
  return useMutation(
    orpc.presetExercise.updateMany.mutationOptions({ onSuccess }),
  )
}

export default useUpdatePresetExercises
