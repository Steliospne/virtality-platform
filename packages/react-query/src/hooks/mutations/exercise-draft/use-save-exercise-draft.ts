import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useSaveExerciseDraft() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.exerciseDraft.save.mutationOptions({
      onSuccess: (draft) => {
        queryClient.invalidateQueries({
          queryKey: orpc.exerciseDraft.list.key(),
        })
        queryClient.invalidateQueries({
          queryKey: orpc.exerciseDraft.get.key({ input: { id: draft.id } }),
        })
      },
    }),
  )
}
