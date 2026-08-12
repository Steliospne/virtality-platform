import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useExtendableSeats() {
  const orpc = useORPC()
  return useQuery(orpc.entitlementExtension.listSeats.queryOptions())
}
