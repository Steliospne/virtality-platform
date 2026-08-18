'use client'

import { CouponPromotionCodeTable } from '@/components/coupon-library/coupon-promotion-code-table'
import { SelectedCouponActions } from '@/components/coupon-library/selected-coupon-actions'
import {
  formatCouponAppliesTo,
  formatCouponDiscount,
  formatCouponDuration,
  formatCouponName,
  formatRelativeCreated,
  getCouponStateLabel,
} from '@/lib/coupon-library-display'
import type {
  CouponLibraryRecord,
  PromotionCodeRecord,
} from '@virtality/shared/utils'
import { Badge } from '@virtality/ui/components/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Megaphone, Tag } from 'lucide-react'
import Link from 'next/link'

function CouponMeta({ coupon }: { coupon: CouponLibraryRecord }) {
  return (
    <div className='flex flex-wrap items-center gap-2 text-sm'>
      <Badge variant={coupon.archived ? 'outline' : 'secondary'}>
        {getCouponStateLabel(coupon)}
      </Badge>
      <Badge variant='outline'>{formatCouponDiscount(coupon)}</Badge>
      <Badge variant='outline'>{formatCouponDuration(coupon)}</Badge>
      <Badge variant='outline'>{formatCouponAppliesTo(coupon)}</Badge>
    </div>
  )
}

function CouponDetailStats({
  created,
  codeStats,
}: {
  created: number
  codeStats: { total: number; active: number; redeemed: number }
}) {
  const items = [
    { label: 'Created', value: formatRelativeCreated(created) },
    { label: 'Codes', value: String(codeStats.total) },
    { label: 'Active', value: String(codeStats.active) },
    { label: 'Redeemed', value: String(codeStats.redeemed) },
  ]

  return (
    <dl className='text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-xs'>
      {items.map((item) => (
        <div key={item.label} className='flex items-baseline gap-1.5'>
          <dt>{item.label}</dt>
          <dd className='text-foreground font-medium'>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

type CouponSelectedDetailProps = {
  coupon: CouponLibraryRecord
  couponId: string
  codeStats: { total: number; active: number; redeemed: number }
  promotionCodes: readonly PromotionCodeRecord[]
  promotionCodesPending: boolean
  createPromoOpen: boolean
  onCreatePromoOpenChange: (open: boolean) => void
}

export function CouponSelectedDetail({
  coupon,
  couponId,
  codeStats,
  promotionCodes,
  promotionCodesPending,
  createPromoOpen,
  onCreatePromoOpenChange,
}: CouponSelectedDetailProps) {
  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='gap-3 pb-3'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='min-w-0 space-y-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <CardTitle className='text-2xl'>
                  {formatCouponName(coupon)}
                </CardTitle>
                <Badge variant={coupon.archived ? 'outline' : 'secondary'}>
                  {getCouponStateLabel(coupon)}
                </Badge>
              </div>
              <CouponMeta coupon={coupon} />
              <CouponDetailStats
                created={coupon.created}
                codeStats={codeStats}
              />
            </div>
            <div className='flex shrink-0 flex-wrap items-center gap-2'>
              <Button
                type='button'
                size='sm'
                variant='primary'
                onClick={() => onCreatePromoOpenChange(true)}
                disabled={coupon.archived}
              >
                <Tag className='size-4' />
                Create Promotion Code
              </Button>
              <Button type='button' size='sm' variant='outline' asChild>
                <Link href='/campaign'>
                  <Megaphone className='size-4' />
                  Campaign Window
                </Link>
              </Button>
              <SelectedCouponActions coupon={coupon} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className='pb-0'>
          <CardTitle className='text-lg'>Promotion Codes</CardTitle>
          <CardDescription>
            Customer-facing codes for this Coupon. Search, filter, copy, email,
            in-app notify, or deactivate below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CouponPromotionCodeTable
            couponId={couponId}
            coupon={coupon}
            codes={promotionCodes}
            isPending={promotionCodesPending}
            createOpen={createPromoOpen}
            onCreateOpenChange={onCreatePromoOpenChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
