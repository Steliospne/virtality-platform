import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { invalidateConsolePromoQueries } from './invalidate-console-promo-queries.js'

export function useCancelPendingPromotionCode() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  return useMutation(
    orpc.consolePromo.cancelPending.mutationOptions({
      onSuccess: async () => {
        await invalidateConsolePromoQueries(queryClient, orpc)
      },
    }),
  )
}
