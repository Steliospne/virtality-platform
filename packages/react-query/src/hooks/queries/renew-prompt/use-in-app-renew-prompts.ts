import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useInAppRenewPrompts() {
  const orpc = useORPC()
  return useQuery(orpc.renewPrompt.listInApp.queryOptions())
}
