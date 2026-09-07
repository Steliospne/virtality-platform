import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useMarkTrialWelcomeSeen() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  return useMutation(
    orpc.entitlementClock.markTrialWelcomeSeen.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.entitlementClock.getStanding.key(),
        })
      },
    }),
  )
}
