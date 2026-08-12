import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useEntitlementStanding() {
  const orpc = useORPC()
  return useQuery(orpc.entitlementClock.getStanding.queryOptions())
}
