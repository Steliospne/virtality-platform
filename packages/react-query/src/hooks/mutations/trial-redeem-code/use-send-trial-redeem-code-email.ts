import { useMutation } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useSendTrialRedeemCodeEmail() {
  const orpc = useORPC()

  return useMutation(orpc.trialRedeemCode.sendEmail.mutationOptions())
}
