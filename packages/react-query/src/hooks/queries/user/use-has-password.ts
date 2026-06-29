import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useHasPassword() {
  const orpc = useORPC()
  return useQuery(orpc.user.hasPassword.queryOptions())
}
