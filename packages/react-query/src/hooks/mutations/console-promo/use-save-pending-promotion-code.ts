import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { invalidateConsolePromoQueries } from './invalidate-console-promo-queries.js'

export function useSavePendingPromotionCode() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  return useMutation(
    orpc.consolePromo.savePending.mutationOptions({
      onSuccess: async () => {
        await invalidateConsolePromoQueries(queryClient, orpc)
      },
    }),
  )
}
