'use client'

import { CreateLibraryCouponDialog } from '@/components/coupon-library/create-library-coupon-dialog'
import { CouponLibraryTopRail } from '@/components/coupon-library/coupon-library-top-rail'
import { CouponSelectedDetail } from '@/components/coupon-library/coupon-selected-detail'
import { useCouponLibraryWorkspaceState } from '@/components/coupon-library/use-coupon-library-workspace'
import { Button } from '@/components/ui/button'
import {
  formatCouponDiscount,
  formatCouponDuration,
} from '@/lib/coupon-library-display'
import { PlusSquare } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

type CouponLibraryWorkspaceProps = {
  initialCouponId?: string
}

export function CouponLibraryWorkspace({
  initialCouponId,
}: CouponLibraryWorkspaceProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const {
    couponList,
    couponsPending,
    selectedCouponId,
    selectedCoupon,
    setSelectedCouponId,
    promotionCodes,
    promotionCodesPending,
    codeStats,
  } = useCouponLibraryWorkspaceState(initialCouponId)
  const [createCouponOpen, setCreateCouponOpen] = useState(false)
  const [createPromoOpen, setCreatePromoOpen] = useState(false)
  const [couponSearch, setCouponSearch] = useState('')
  const [couponStatusFilters, setCouponStatusFilters] = useState<string[]>([])

  const filteredCoupons = useMemo(() => {
    let list = couponList

    if (couponStatusFilters.length > 0) {
      list = list.filter((coupon) => {
        const status = coupon.archived ? 'archived' : 'active'
        return couponStatusFilters.includes(status)
      })
    }

    const query = couponSearch.trim().toLowerCase()
    if (query) {
      list = list.filter((coupon) => {
        const haystack = [
          coupon.name ?? '',
          coupon.id,
          formatCouponDiscount(coupon),
          formatCouponDuration(coupon),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
    }

    return list
  }, [couponSearch, couponStatusFilters, couponList])

  const selectCoupon = useCallback(
    (couponId: string) => {
      setSelectedCouponId((current) =>
        current === couponId ? current : couponId,
      )

      const currentParam = searchParams.get('coupon')
      if (couponId ? currentParam === couponId : !currentParam) {
        return
      }

      const params = new URLSearchParams(searchParams.toString())
      if (couponId) {
        params.set('coupon', couponId)
      } else {
        params.delete('coupon')
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams, setSelectedCouponId],
  )

  useEffect(() => {
    if (filteredCoupons.length === 0) return

    const selectedIsVisible = filteredCoupons.some(
      (coupon) => coupon.id === selectedCouponId,
    )
    if (selectedCouponId && selectedIsVisible) return

    const nextCouponId = filteredCoupons[0]?.id ?? ''
    if (nextCouponId === selectedCouponId) return

    selectCoupon(nextCouponId)
  }, [filteredCoupons, selectCoupon, selectedCouponId])

  const toggleCouponStatusFilter = (status: string) => {
    setCouponStatusFilters((current) =>
      current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status],
    )
  }

  if (couponsPending) {
    return (
      <div className='p-8'>
        <p className='text-muted-foreground'>Loading Coupons...</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen-with-header space-y-6 p-8'>
      <div className='mb-2'>
        <h1 className='text-4xl font-bold tracking-tight'>Coupon library</h1>
        <p className='text-muted-foreground mt-2 max-w-3xl text-sm leading-6'>
          Reusable Stripe Coupons and their customer-facing Promotion Codes in
          one workspace. Pick a Coupon above to manage codes, delivery, and
          campaign usage below.
        </p>
      </div>

      {couponList.length === 0 ? (
        <div className='rounded-xl border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4 text-sm'>
            No Coupons yet. Create a reusable discount to attach Promotion Codes
            or use in a Campaign Window.
          </p>
          <Button
            type='button'
            variant='primary'
            onClick={() => setCreateCouponOpen(true)}
          >
            <PlusSquare className='size-4' />
            Create Coupon
          </Button>
        </div>
      ) : (
        <CouponLibraryTopRail
          coupons={filteredCoupons}
          selectedCouponId={selectedCouponId}
          onSelect={selectCoupon}
          onCreateCoupon={() => setCreateCouponOpen(true)}
          searchQuery={couponSearch}
          onSearchQueryChange={setCouponSearch}
          statusFilters={couponStatusFilters}
          onToggleStatusFilter={toggleCouponStatusFilter}
        />
      )}

      {selectedCoupon ? (
        <CouponSelectedDetail
          coupon={selectedCoupon}
          couponId={selectedCouponId}
          codeStats={codeStats}
          promotionCodes={promotionCodes}
          promotionCodesPending={promotionCodesPending}
          createPromoOpen={createPromoOpen}
          onCreatePromoOpenChange={setCreatePromoOpen}
        />
      ) : null}

      <CreateLibraryCouponDialog
        open={createCouponOpen}
        onOpenChange={setCreateCouponOpen}
      />
    </div>
  )
}
