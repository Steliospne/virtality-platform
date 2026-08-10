import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useDeleteTrialRedeemCode() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.trialRedeemCode.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.trialRedeemCode.list.key(),
        })
      },
    }),
  )
}
