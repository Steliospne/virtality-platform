import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useAdminCustomers() {
  const orpc = useORPC()
  return useQuery(orpc.adminCustomer.list.queryOptions())
}
