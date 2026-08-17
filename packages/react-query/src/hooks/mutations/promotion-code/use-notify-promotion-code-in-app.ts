import { useMutation } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useNotifyPromotionCodeInApp() {
  const orpc = useORPC()
  return useMutation(orpc.promotionCode.notifyInApp.mutationOptions())
}
