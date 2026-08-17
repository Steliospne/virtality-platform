import { useMutation } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useSendPromotionCodeEmail() {
  const orpc = useORPC()
  return useMutation(orpc.promotionCode.sendEmail.mutationOptions())
}
