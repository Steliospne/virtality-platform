'use client'

import { getPromotionSummary } from '@/lib/coupon-library-display'
import { useLibraryCoupons, usePromotionCodes } from '@virtality/react-query'
import type { CouponLibraryRecord } from '@virtality/shared/utils'
import { useEffect, useMemo, useState } from 'react'

const EMPTY_COUPON_LIST: CouponLibraryRecord[] = []

export function useCouponLibraryWorkspaceState(initialCouponId?: string) {
  const { data: coupons, isPending: couponsPending } = useLibraryCoupons()
  const couponList = useMemo(() => coupons ?? EMPTY_COUPON_LIST, [coupons])
  const [selectedCouponId, setSelectedCouponId] = useState('')

  useEffect(() => {
    setSelectedCouponId((current) => {
      if (couponList.length === 0) {
        return current === '' ? current : ''
      }

      if (
        initialCouponId &&
        couponList.some((coupon) => coupon.id === initialCouponId)
      ) {
        return current === initialCouponId ? current : initialCouponId
      }

      if (current && couponList.some((coupon) => coupon.id === current)) {
        return current
      }

      const next = couponList[0]?.id ?? ''
      return current === next ? current : next
    })
  }, [couponList, initialCouponId])

  const selectedCoupon =
    couponList.find((coupon) => coupon.id === selectedCouponId) ?? null
  const { data: promotionCodes, isPending: promotionCodesPending } =
    usePromotionCodes(selectedCouponId)

  const codeStats = useMemo(
    () => getPromotionSummary(promotionCodes ?? []),
    [promotionCodes],
  )

  return {
    couponList,
    couponsPending,
    selectedCouponId,
    selectedCoupon,
    setSelectedCouponId,
    promotionCodes: promotionCodes ?? [],
    promotionCodesPending,
    codeStats,
  }
}
