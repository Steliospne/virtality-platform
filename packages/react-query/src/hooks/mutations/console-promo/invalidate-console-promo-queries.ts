import type { QueryClient } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'

export function invalidateConsolePromoQueries(
  queryClient: QueryClient,
  orpc: ORPCUtils,
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: orpc.consolePromo.readDiscount.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: orpc.consolePromo.redeemPreflight.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: orpc.consolePromo.readPending.key(),
    }),
  ])
}
