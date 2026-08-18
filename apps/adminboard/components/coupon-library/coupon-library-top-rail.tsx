'use client'

import FilterBadge from '@/components/ui/filter-badge'
import { Button } from '@/components/ui/button'
import {
  formatCouponDiscount,
  formatCouponDuration,
  formatCouponName,
  getCouponStateLabel,
} from '@/lib/coupon-library-display'
import { cn } from '@/lib/utils'
import type { CouponLibraryRecord } from '@virtality/shared/utils'
import { Badge } from '@virtality/ui/components/badge'
import { Input } from '@virtality/ui/components/input'
import { ChevronLeft, ChevronRight, PlusSquare } from 'lucide-react'
import { useHorizontalRailScroll } from './use-horizontal-rail-scroll'

const COUPON_RAIL_STATUS_FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
] as const

type CouponLibraryTopRailProps = {
  coupons: readonly CouponLibraryRecord[]
  selectedCouponId: string
  onSelect: (couponId: string) => void
  onCreateCoupon: () => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  statusFilters: readonly string[]
  onToggleStatusFilter: (status: string) => void
}

export function CouponLibraryTopRail({
  coupons,
  selectedCouponId,
  onSelect,
  onCreateCoupon,
  searchQuery,
  onSearchQueryChange,
  statusFilters,
  onToggleStatusFilter,
}: CouponLibraryTopRailProps) {
  const {
    scrollRef,
    scrollState,
    updateScrollState,
    startAutoScroll,
    stopAutoScroll,
  } = useHorizontalRailScroll(coupons.length)

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <p className='text-sm font-medium'>Coupon library</p>
          <p className='text-muted-foreground text-xs'>
            Select a reusable discount. Promotion Codes for that Coupon appear
            below.
          </p>
        </div>
        <Button
          type='button'
          size='sm'
          variant='primary'
          onClick={onCreateCoupon}
        >
          <PlusSquare className='size-4' />
          Create Coupon
        </Button>
      </div>

      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <Input
          placeholder='Search coupons...'
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className='max-w-sm'
        />
        <div className='flex flex-wrap items-center gap-2'>
          {COUPON_RAIL_STATUS_FILTERS.map((status) => (
            <FilterBadge
              key={status.id}
              name={status.label}
              checked={statusFilters.includes(status.id)}
              onClick={() => onToggleStatusFilter(status.id)}
            />
          ))}
        </div>
      </div>

      {coupons.length === 0 ? (
        <div className='rounded-xl border border-dashed p-5 text-sm text-zinc-500'>
          No Coupons match your search or filters.
        </div>
      ) : (
        <div className='relative'>
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className={cn(
              'flex gap-3 overflow-x-auto px-1 pt-2',
              '[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]',
              '[&::-webkit-scrollbar]:h-2.5',
              '[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-100',
              'dark:[&::-webkit-scrollbar-track]:bg-zinc-800',
              '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300',
              'dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600',
              scrollState.hasOverflow ? 'pb-3' : 'pb-2',
            )}
          >
            {coupons.map((coupon) => {
              const selected = selectedCouponId === coupon.id
              return (
                <button
                  key={coupon.id}
                  type='button'
                  onClick={() => onSelect(coupon.id)}
                  className={cn(
                    'min-h-18 shrink-0 rounded-xl border px-4 py-3.5 text-left transition-colors',
                    selected
                      ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                      : 'hover:bg-muted/50 bg-background',
                  )}
                >
                  <div className='flex items-center gap-2'>
                    <p className='max-w-44 truncate text-sm font-medium'>
                      {formatCouponName(coupon)}
                    </p>
                    <Badge
                      variant={coupon.archived ? 'outline' : 'secondary'}
                      className='text-[10px]'
                    >
                      {getCouponStateLabel(coupon)}
                    </Badge>
                  </div>
                  <p
                    className={cn(
                      'mt-1.5 text-xs leading-relaxed',
                      selected
                        ? 'text-white/70 dark:text-zinc-700'
                        : 'text-muted-foreground',
                    )}
                  >
                    {formatCouponDiscount(coupon)} ·{' '}
                    {formatCouponDuration(coupon)}
                  </p>
                </button>
              )
            })}
          </div>

          {scrollState.canScrollLeft ? (
            <button
              type='button'
              aria-label='Scroll coupons left'
              className='group absolute top-2 left-0 z-10 flex h-[calc(4.5rem+1rem)] w-14 cursor-pointer items-center justify-start pl-1'
              onMouseEnter={() => startAutoScroll('left')}
              onMouseLeave={stopAutoScroll}
              onFocus={() => startAutoScroll('left')}
              onBlur={stopAutoScroll}
            >
              <span
                aria-hidden
                className='from-background via-background/95 pointer-events-none absolute inset-0 bg-linear-to-r from-15% via-55% to-transparent'
              />
              <ChevronLeft className='text-muted-foreground group-hover:text-foreground relative z-10 size-4 transition-colors' />
            </button>
          ) : null}
          {scrollState.canScrollRight ? (
            <button
              type='button'
              aria-label='Scroll coupons right'
              className='group absolute top-2 right-0 z-10 flex h-[calc(4.5rem+1rem)] w-14 cursor-pointer items-center justify-end pr-1'
              onMouseEnter={() => startAutoScroll('right')}
              onMouseLeave={stopAutoScroll}
              onFocus={() => startAutoScroll('right')}
              onBlur={stopAutoScroll}
            >
              <span
                aria-hidden
                className='from-background via-background/95 pointer-events-none absolute inset-0 bg-linear-to-l from-15% via-55% to-transparent'
              />
              <ChevronRight className='text-muted-foreground group-hover:text-foreground relative z-10 size-4 transition-colors' />
            </button>
          ) : null}

          {scrollState.hasOverflow ? (
            <p className='text-muted-foreground mt-2 text-xs'>
              {scrollState.canScrollRight
                ? 'Scroll horizontally for more Coupons'
                : 'End of Coupon library'}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
