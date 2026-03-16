import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useUsers() {
  const orpc = useORPC()
  return useQuery(orpc.user.list.queryOptions())
}
