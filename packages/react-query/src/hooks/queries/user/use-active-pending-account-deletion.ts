import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export type ActivePendingAccountDeletion = {
  id: string
  destinationEmail: string
  expiresAt: Date
}

export function useActivePendingAccountDeletion(): UseQueryResult<
  ActivePendingAccountDeletion | null,
  Error
> {
  const orpc = useORPC()
  return useQuery(orpc.pendingAccountDeletion.getActive.queryOptions())
}
