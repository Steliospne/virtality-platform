import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function usePromotionCodes(couponId: string) {
  const orpc = useORPC()
  return useQuery({
    ...orpc.promotionCode.list.queryOptions({
      input: { couponId },
    }),
    enabled: Boolean(couponId),
  })
}
