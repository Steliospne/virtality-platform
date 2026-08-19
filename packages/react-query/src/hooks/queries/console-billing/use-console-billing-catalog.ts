import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

const BILLING_CATALOG_STALE_MS = 15 * 60 * 1000

export function useConsoleBillingCatalog() {
  const orpc = useORPC()
  return useQuery({
    ...orpc.consoleBilling.readCatalog.queryOptions(),
    staleTime: BILLING_CATALOG_STALE_MS,
  })
}
