import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useEvaluateRenewPrompts() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.renewPrompt.evaluate.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.renewPrompt.listInApp.key(),
        })
      },
    }),
  )
}
