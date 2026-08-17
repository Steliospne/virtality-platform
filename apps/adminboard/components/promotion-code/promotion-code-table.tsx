'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { ArrowLeft, PlusSquare } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useLibraryCoupons, usePromotionCodes } from '@virtality/react-query'
import type { CouponLibraryRecord } from '@virtality/shared/utils'
import { createPromotionCodeColumns } from '@/components/promotion-code/columns'
import { CreatePromotionCodeDialog } from '@/components/promotion-code/create-promotion-code-dialog'
import { Button } from '@/components/ui/button'
import FilterBadge from '@/components/ui/filter-badge'
import {
  formatCouponAppliesTo,
  formatCouponDiscount,
  formatCouponDuration,
} from '@/lib/coupon-library-display'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'

const STATUS_FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
] as const

type PromotionCodeTableProps = {
  couponId: string
}

function formatCouponSubtitle(
  coupon: CouponLibraryRecord | null,
  couponId: string,
  couponsPending: boolean,
): string {
  if (couponsPending) return 'Loading Coupon…'
  if (!coupon) return `Coupon ${couponId}`

  const parts = [
    coupon.name ?? coupon.id,
    formatCouponDiscount(coupon),
    formatCouponDuration(coupon),
    formatCouponAppliesTo(coupon),
  ]
  if (coupon.archived) {
    parts.push('Archived')
  }
  return parts.join(' · ')
}

const PromotionCodeTable = ({ couponId }: PromotionCodeTableProps) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const { data: coupons, isPending: couponsPending } = useLibraryCoupons()
  const { data, isPending } = usePromotionCodes(couponId)
  const coupon = coupons?.find((entry) => entry.id === couponId) ?? null
  const columns = useMemo(
    () => createPromotionCodeColumns(couponId),
    [couponId],
  )
  const { table, globalFilter, setGlobalFilter, setColumnFilters } =
    useResourceTable({
      data: data ?? [],
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
    <div className='p-8'>
      <div className='mb-6 flex flex-col gap-3'>
        <Button variant='ghost' className='w-fit px-0' asChild>
          <Link href='/coupons'>
            <ArrowLeft />
            Back to Coupon library
          </Link>
        </Button>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Promotion Codes</h1>
          <p className='text-muted-foreground mt-1'>
            {formatCouponSubtitle(coupon, couponId, couponsPending)}
          </p>
        </div>
      </div>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        filters={
          <div className='flex flex-wrap items-center gap-2'>
            {STATUS_FILTERS.map((status) => (
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
          onClick={() => setCreateOpen(true)}
          disabled={coupon?.archived === true}
        >
          <PlusSquare />
          Create
        </Button>
      </DataTableHeader>
      <DataTableBody table={table} columns={columns} isLoading={isPending} />
      <DataTableFooter table={table} />
      <CreatePromotionCodeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        couponId={couponId}
        couponName={coupon?.name ?? null}
        couponArchived={coupon?.archived === true}
      />
    </div>
  )
}

export default PromotionCodeTable
