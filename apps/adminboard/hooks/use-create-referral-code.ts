'use client'

import { useMutation } from '@tanstack/react-query'
import { createReferralCode } from '@/data/server/referral'
import { getQueryClient } from '@/react-query'
import { referralKeys } from '@/data/client/referral'

const useCreateReferralCode = () => {
  const queryClient = getQueryClient()

  return useMutation({
    mutationFn: () => createReferralCode(),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: referralKeys.all })
    },
    mutationKey: ['createReferralCode'],
  })
}

export default useCreateReferralCode
