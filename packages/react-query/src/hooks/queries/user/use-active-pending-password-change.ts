import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

type ActivePendingPasswordChange = {
  id: string
  kind: 'SETUP' | 'CHANGE'
  destinationEmail: string
  expiresAt: Date
} | null

export function useActivePendingPasswordChange(): UseQueryResult<
  ActivePendingPasswordChange,
  Error
> {
  const orpc = useORPC()
  return useQuery(orpc.pendingPasswordChange.getActive.queryOptions())
}
