import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useDiscardExerciseDraft() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.exerciseDraft.discard.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.exerciseDraft.list.key(),
        })
      },
    }),
  )
}
