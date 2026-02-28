'use client'

import { useMutation } from '@tanstack/react-query'
import { deleteReferralCode } from '@/data/server/referral'
import { getQueryClient } from '@/react-query'
import { referralKeys } from '@/data/client/referral'

const useDeleteReferralCode = () => {
  const queryClient = getQueryClient()

  return useMutation({
    mutationFn: deleteReferralCode,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: referralKeys.all })
    },
    mutationKey: ['deleteReferralCode'],
  })
}

export default useDeleteReferralCode
