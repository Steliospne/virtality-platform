import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useAdminCustomerProfile(userId: string | null) {
  const orpc = useORPC()
  return useQuery({
    ...orpc.adminCustomer.getProfile.queryOptions({
      input: { userId: userId ?? '' },
    }),
    enabled: Boolean(userId),
  })
}
