import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useReferralCodes() {
  const orpc = useORPC()
  return useQuery(orpc.referral.list.queryOptions())
}
