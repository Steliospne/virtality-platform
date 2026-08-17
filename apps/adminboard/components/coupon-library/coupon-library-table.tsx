'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { PlusSquare } from 'lucide-react'
import { useState } from 'react'
import { useLibraryCoupons } from '@virtality/react-query'
import { columns } from '@/components/coupon-library/columns'
import { CreateLibraryCouponDialog } from '@/components/coupon-library/create-library-coupon-dialog'
import { Button } from '@/components/ui/button'
import FilterBadge from '@/components/ui/filter-badge'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'

const STATUS_FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
] as const

const CouponLibraryTable = () => {
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const { data, isPending } = useLibraryCoupons()
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
    setColumnFilters(next.length > 0 ? [{ id: 'archived', value: next }] : [])
  }

  return (
    <div className='p-8'>
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
        >
          <PlusSquare />
          Create
        </Button>
      </DataTableHeader>
      <DataTableBody table={table} columns={columns} isLoading={isPending} />
      <DataTableFooter table={table} />
      <CreateLibraryCouponDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}

export default CouponLibraryTable
