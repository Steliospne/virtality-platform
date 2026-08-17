import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useConsoleSubscriptionDiscount() {
  const orpc = useORPC()
  return useQuery(orpc.consolePromo.readDiscount.queryOptions())
}
