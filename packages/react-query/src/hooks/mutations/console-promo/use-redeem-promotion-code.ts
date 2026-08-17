import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useRedeemPromotionCode() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  return useMutation(
    orpc.consolePromo.redeem.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.consolePromo.readDiscount.key(),
          }),
          queryClient.invalidateQueries({
            queryKey: orpc.consolePromo.redeemPreflight.key(),
          }),
        ])
      },
    }),
  )
}
