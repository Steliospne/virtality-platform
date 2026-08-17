import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useUpsertCampaignWindow() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.campaignWindow.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.campaignWindow.get.key(),
        })
      },
    }),
  )
}
