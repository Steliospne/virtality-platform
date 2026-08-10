import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useCreateTrialRedeemCode() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.trialRedeemCode.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.trialRedeemCode.list.key(),
        })
      },
    }),
  )
}
