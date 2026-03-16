import { useMutation } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type DeleteReferralCodeOnSuccess = ReturnType<
  ORPCUtils['referral']['delete']['mutationOptions']
>['onSuccess']

interface UseDeleteReferralCodeProps {
  onSuccess?: DeleteReferralCodeOnSuccess
}

export function useDeleteReferralCode({
  onSuccess,
}: UseDeleteReferralCodeProps = {}) {
  const orpc = useORPC()
  return useMutation(orpc.referral.delete.mutationOptions({ onSuccess }))
}
