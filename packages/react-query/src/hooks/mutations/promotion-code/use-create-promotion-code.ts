import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useCreatePromotionCode() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  return useMutation(
    orpc.promotionCode.create.mutationOptions({
      onSuccess: async (_data, variables) => {
        await queryClient.invalidateQueries({
          queryKey: orpc.promotionCode.list.key({
            input: { couponId: variables.couponId },
          }),
        })
      },
    }),
  )
}
