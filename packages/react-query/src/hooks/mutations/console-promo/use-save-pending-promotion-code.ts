import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { invalidateConsolePromoQueries } from './invalidate-console-promo-queries.js'

export function useSavePendingPromotionCode() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  return useMutation(
    orpc.consolePromo.savePending.mutationOptions({
      onSuccess: async (data) => {
        queryClient.setQueryData(orpc.consolePromo.readPending.key(), {
          code: data.code,
          promotionCodeId: data.promotionCodeId,
          couponId: data.couponId,
          expiresAt: data.expiresAt,
          couponTerms: data.couponTerms,
        })
        await invalidateConsolePromoQueries(queryClient, orpc)
      },
    }),
  )
}
