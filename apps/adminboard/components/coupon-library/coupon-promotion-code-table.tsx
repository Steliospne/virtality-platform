'use client'

import { createPromotionCodeColumns } from '@/components/promotion-code/columns'
import { CreatePromotionCodeDialog } from '@/components/promotion-code/create-promotion-code-dialog'
import FilterBadge from '@/components/ui/filter-badge'
import { Button } from '@/components/ui/button'
import type {
  CouponLibraryRecord,
  PromotionCodeRecord,
} from '@virtality/shared/utils'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'
import { PlusSquare } from 'lucide-react'
import { useMemo, useState } from 'react'

const PROMO_CODE_STATUS_FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
] as const

type CouponPromotionCodeTableProps = {
  couponId: string
  coupon: CouponLibraryRecord
  codes: readonly PromotionCodeRecord[]
  isPending: boolean
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
}

export function CouponPromotionCodeTable({
  couponId,
  coupon,
  codes,
  isPending,
  createOpen,
  onCreateOpenChange,
}: CouponPromotionCodeTableProps) {
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
