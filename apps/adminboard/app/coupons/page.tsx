import { CouponLibraryWorkspace } from '@/components/coupon-library/coupon-library-workspace'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

type CouponLibraryPageProps = {
  searchParams?: Promise<{ coupon?: string }>
}

const CouponLibraryPage = async ({ searchParams }: CouponLibraryPageProps) => {
  const params = await searchParams
  return (
    <Suspense
      fallback={
        <div className='p-8'>
          <p className='text-muted-foreground'>Loading Coupons...</p>
        </div>
      }
    >
      <CouponLibraryWorkspace initialCouponId={params?.coupon} />
    </Suspense>
  )
}

export default CouponLibraryPage
