'use client'

import { CreateLibraryCouponDialog } from '@/components/coupon-library/create-library-coupon-dialog'
import { DeleteLibraryCouponDialog } from '@/components/coupon-library/delete-library-coupon-dialog'
import { EditLibraryCouponNameDialog } from '@/components/coupon-library/edit-library-coupon-name-dialog'
import { createPromotionCodeColumns } from '@/components/promotion-code/columns'
import { CreatePromotionCodeDialog } from '@/components/promotion-code/create-promotion-code-dialog'
import { Button } from '@/components/ui/button'
import FilterBadge from '@/components/ui/filter-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDropdownMenu } from '@/hooks/use-dropdown-menu-action'
import { getErrorMessage } from '@/lib/get-error-message'
import {
  formatCouponAppliesTo,
  formatCouponDiscount,
  formatCouponDuration,
} from '@/lib/coupon-library-display'
import { cn } from '@/lib/utils'
import {
  useArchiveLibraryCoupon,
  useLibraryCoupons,
  usePromotionCodes,
} from '@virtality/react-query'
import type {
  CouponLibraryRecord,
  PromotionCodeRecord,
} from '@virtality/shared/utils'
import { Badge } from '@virtality/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { Input } from '@virtality/ui/components/input'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Megaphone,
  Pencil,
  PlusSquare,
  Tag,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

const COUPON_RAIL_STATUS_FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
] as const

const PROMO_CODE_STATUS_FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
] as const

type CouponLibraryWorkspaceProps = {
  initialCouponId?: string
}

function formatCouponName(coupon: CouponLibraryRecord): string {
  return coupon.name ?? coupon.id
}

function getCouponStateLabel(coupon: CouponLibraryRecord): string {
  return coupon.archived ? 'Archived' : 'Active'
}

function formatRelativeCreated(createdSeconds: number): string {
  return new Date(createdSeconds * 1000).toLocaleDateString()
}

function getPromotionSummary(codes: readonly PromotionCodeRecord[]) {
  const active = codes.filter((code) => code.active).length
  const redeemed = codes.reduce((sum, code) => sum + code.timesRedeemed, 0)
  return { total: codes.length, active, redeemed }
}

const EMPTY_COUPON_LIST: CouponLibraryRecord[] = []

function useCouponLibraryWorkspaceState(initialCouponId?: string) {
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

function CouponLibraryTopRail({
  coupons,
  selectedCouponId,
  onSelect,
  onCreateCoupon,
  searchQuery,
  onSearchQueryChange,
  statusFilters,
  onToggleStatusFilter,
}: {
  coupons: readonly CouponLibraryRecord[]
  selectedCouponId: string
  onSelect: (couponId: string) => void
  onCreateCoupon: () => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  statusFilters: readonly string[]
  onToggleStatusFilter: (status: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollAnimationRef = useRef<number | null>(null)
  const scrollDirectionRef = useRef<'left' | 'right' | null>(null)
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    hasOverflow: false,
  })

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const hasOverflow = element.scrollWidth > element.clientWidth + 1
    setScrollState({
      hasOverflow,
      canScrollLeft: element.scrollLeft > 1,
      canScrollRight:
        element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
    })
  }, [])

  const stopAutoScroll = useCallback(() => {
    scrollDirectionRef.current = null
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current)
      scrollAnimationRef.current = null
    }
  }, [])

  const startAutoScroll = useCallback(
    (direction: 'left' | 'right') => {
      stopAutoScroll()
      scrollDirectionRef.current = direction

      const tick = () => {
        const element = scrollRef.current
        const activeDirection = scrollDirectionRef.current
        if (!element || !activeDirection) return

        const maxScroll = element.scrollWidth - element.clientWidth
        const delta = activeDirection === 'left' ? -2.2 : 2.2
        const nextScroll = element.scrollLeft + delta

        if (activeDirection === 'left' && nextScroll <= 0) {
          element.scrollLeft = 0
          stopAutoScroll()
          return
        }
        if (activeDirection === 'right' && nextScroll >= maxScroll) {
          element.scrollLeft = maxScroll
          stopAutoScroll()
          return
        }

        element.scrollLeft = nextScroll
        scrollAnimationRef.current = requestAnimationFrame(tick)
      }

      scrollAnimationRef.current = requestAnimationFrame(tick)
    },
    [stopAutoScroll],
  )

  useEffect(() => {
    updateScrollState()
    const element = scrollRef.current
    if (!element) return

    const observer = new ResizeObserver(updateScrollState)
    observer.observe(element)
    return () => observer.disconnect()
  }, [coupons.length, updateScrollState])

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll])

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

function SelectedCouponActions({ coupon }: { coupon: CouponLibraryRecord }) {
  const { open, setOpen, runAfterClose } = useDropdownMenu()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { mutate: archiveLibraryCoupon } = useArchiveLibraryCoupon()

  const handleArchive = () =>
    archiveLibraryCoupon(
      { id: coupon.id },
      {
        onSuccess: () => toast.success('Coupon archived'),
        onError: (error) =>
          toast.error(getErrorMessage(error, 'Failed to archive Coupon')),
      },
    )

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button type='button' size='sm' variant='outline'>
            <Ellipsis className='size-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            onSelect={() => runAfterClose(() => setEditOpen(true))}
          >
            <Pencil />
            Edit name
          </DropdownMenuItem>
          {!coupon.archived ? (
            <DropdownMenuItem onSelect={handleArchive}>
              <Archive />
              Archive
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onSelect={() => runAfterClose(() => setDeleteOpen(true))}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditLibraryCouponNameDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        coupon={coupon}
      />
      <DeleteLibraryCouponDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        coupon={coupon}
      />
    </>
  )
}

function CouponPromotionCodeTable({
  couponId,
  coupon,
  codes,
  isPending,
  createOpen,
  onCreateOpenChange,
}: {
  couponId: string
  coupon: CouponLibraryRecord
  codes: readonly PromotionCodeRecord[]
  isPending: boolean
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
}) {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const columns = useMemo(
    () => createPromotionCodeColumns(couponId),
    [couponId],
  )
  const tableData = useMemo(() => [...codes], [codes])
  const { table, globalFilter, setGlobalFilter, setColumnFilters } =
    useResourceTable({
      data: tableData,
      columns,
      getRowId: (row) => row.id,
      enableColumnFilters: true,
    })

  const toggleStatus = (status: string) => {
    const next = selectedStatuses.includes(status)
      ? selectedStatuses.filter((value) => value !== status)
      : [...selectedStatuses, status]

    setSelectedStatuses(next)
    setColumnFilters(next.length > 0 ? [{ id: 'active', value: next }] : [])
  }

  return (
    <>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        className='py-0'
        filters={
          <div className='flex flex-wrap items-center gap-2'>
            {PROMO_CODE_STATUS_FILTERS.map((status) => (
              <FilterBadge
                key={status.id}
                name={status.label}
                checked={selectedStatuses.includes(status.id)}
                onClick={() => toggleStatus(status.id)}
              />
            ))}
          </div>
        }
      >
        <Button
          variant='primary'
          className='ml-auto flex items-center'
          onClick={() => onCreateOpenChange(true)}
          disabled={coupon.archived}
        >
          <PlusSquare />
          Create Promotion Code
        </Button>
      </DataTableHeader>
      <DataTableBody table={table} columns={columns} isLoading={isPending} />
      <DataTableFooter table={table} />
      <CreatePromotionCodeDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        couponId={couponId}
        couponName={coupon.name ?? null}
        couponArchived={coupon.archived}
      />
    </>
  )
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
        <div className='space-y-4'>
          <Card>
            <CardHeader className='gap-3 pb-3'>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div className='min-w-0 space-y-2'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <CardTitle className='text-2xl'>
                      {formatCouponName(selectedCoupon)}
                    </CardTitle>
                    <Badge
                      variant={
                        selectedCoupon.archived ? 'outline' : 'secondary'
                      }
                    >
                      {getCouponStateLabel(selectedCoupon)}
                    </Badge>
                  </div>
                  <CouponMeta coupon={selectedCoupon} />
                  <CouponDetailStats
                    created={selectedCoupon.created}
                    codeStats={codeStats}
                  />
                </div>
                <div className='flex shrink-0 flex-wrap items-center gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    variant='primary'
                    onClick={() => setCreatePromoOpen(true)}
                    disabled={selectedCoupon.archived}
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
                  <SelectedCouponActions coupon={selectedCoupon} />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className='pb-0'>
              <CardTitle className='text-lg'>Promotion Codes</CardTitle>
              <CardDescription>
                Customer-facing codes for this Coupon. Search, filter, copy,
                email, in-app notify, or deactivate below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CouponPromotionCodeTable
                couponId={selectedCouponId}
                coupon={selectedCoupon}
                codes={promotionCodes}
                isPending={promotionCodesPending}
                createOpen={createPromoOpen}
                onCreateOpenChange={setCreatePromoOpen}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      <CreateLibraryCouponDialog
        open={createCouponOpen}
        onOpenChange={setCreateCouponOpen}
      />
    </div>
  )
}
