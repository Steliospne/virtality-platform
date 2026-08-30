import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { invalidateConsolePromoQueries } from '../console-promo/invalidate-console-promo-queries.js'

export function useRedeemAccessCode() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  return useMutation(
    orpc.consoleAccessCode.redeem.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          invalidateConsolePromoQueries(queryClient, orpc),
          queryClient.invalidateQueries({
            queryKey: orpc.entitlementClock.getStanding.key(),
          }),
        ])
      },
    }),
  )
}
