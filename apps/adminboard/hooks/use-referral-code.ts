'use client'

import { createReferralQuery } from '@/data/client/referral'
import { useQuery } from '@tanstack/react-query'

const useReferralCode = () => {
  return useQuery(createReferralQuery())
}

export default useReferralCode
