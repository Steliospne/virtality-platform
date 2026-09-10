import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useCreateExerciseDraft() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.exerciseDraft.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.exerciseDraft.list.key(),
        })
      },
    }),
  )
}
