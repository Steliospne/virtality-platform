import { queryOptions } from '@tanstack/react-query'
import { getReferralCodes } from '@/data/server/referral'

export const referralKeys = { all: ['referral'] } as const

export const createReferralQuery = () => {
  return queryOptions({
    queryKey: referralKeys.all,
    queryFn: getReferralCodes,
  })
}
