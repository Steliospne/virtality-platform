import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useConsolePromoRedeemPreflight() {
  const orpc = useORPC()
  return useQuery(orpc.consolePromo.redeemPreflight.queryOptions())
}
