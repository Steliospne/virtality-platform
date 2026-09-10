import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function usePromoteExerciseDraft() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.exerciseDraft.promote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.exerciseDraft.list.key(),
        })
        queryClient.invalidateQueries({
          queryKey: orpc.exercise.list.key(),
        })
      },
    }),
  )
}
