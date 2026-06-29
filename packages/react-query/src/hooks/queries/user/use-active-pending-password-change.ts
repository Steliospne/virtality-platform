import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export type ActivePendingPasswordChange = {
  id: string
  kind: 'SETUP' | 'CHANGE'
  destinationEmail: string
  expiresAt: Date
}

export function useActivePendingPasswordChange(): UseQueryResult<
  ActivePendingPasswordChange | null,
  Error
> {
  const orpc = useORPC()
  return useQuery(orpc.pendingPasswordChange.getActive.queryOptions())
}
