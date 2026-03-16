import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useBucket() {
  const orpc = useORPC()
  return useQuery(orpc.bucket.list.queryOptions())
}
