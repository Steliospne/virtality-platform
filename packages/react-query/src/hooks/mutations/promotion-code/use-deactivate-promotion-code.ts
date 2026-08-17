import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useDeactivatePromotionCode(couponId: string) {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  return useMutation(
    orpc.promotionCode.deactivate.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.promotionCode.list.key({
            input: { couponId },
          }),
        })
      },
    }),
  )
}
