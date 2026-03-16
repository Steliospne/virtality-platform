import { useMutation } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useCreateReferralCode() {
  const orpc = useORPC()
  return useMutation(orpc.referral.create.mutationOptions())
}
