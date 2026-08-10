import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useExtendEntitlementClock() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.entitlementExtension.extend.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.entitlementExtension.listSeats.key(),
        })
      },
    }),
  )
}
