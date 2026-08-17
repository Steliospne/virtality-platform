import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useLibraryCoupons() {
  const orpc = useORPC()
  return useQuery(orpc.couponLibrary.list.queryOptions())
}
