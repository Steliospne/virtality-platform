import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useTesterCodes() {
  const orpc = useORPC()
  return useQuery(orpc.testerCode.list.queryOptions())
}
