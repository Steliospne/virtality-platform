import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useConsolePendingPromotionCode() {
  const orpc = useORPC()
  return useQuery(orpc.consolePromo.readPending.queryOptions())
}
