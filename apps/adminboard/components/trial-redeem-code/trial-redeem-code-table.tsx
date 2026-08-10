'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { PlusSquare } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTrialRedeemCodes } from '@virtality/react-query'
import {
  TRIAL_REDEEM_DISPLAY_STATUS_LABELS,
  TRIAL_REDEEM_DISPLAY_STATUSES,
  type TrialRedeemDisplayStatus,
} from '@virtality/shared/utils'
import { columns } from '@/components/trial-redeem-code/columns'
import { CreateTrialRedeemCodeDialog } from '@/components/trial-redeem-code/create-trial-redeem-code-dialog'
import { Button } from '@/components/ui/button'
import FilterBadge from '@/components/ui/filter-badge'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'

const TrialRedeemCodeTable = () => {
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<
    TrialRedeemDisplayStatus[]
  >([])
  const { data, isPending } = useTrialRedeemCodes()
  const { table, globalFilter, setGlobalFilter, setColumnFilters } =
    useResourceTable({
      data: data ?? [],
      columns,
      getRowId: (row) => String(row.id),
      enableColumnFilters: true,
    })

  const statusFilters = useMemo(
    () =>
      TRIAL_REDEEM_DISPLAY_STATUSES.map((status) => ({
        status,
        label: TRIAL_REDEEM_DISPLAY_STATUS_LABELS[status],
        checked: selectedStatuses.includes(status),
      })),
    [selectedStatuses],
  )

  const toggleStatus = (status: TrialRedeemDisplayStatus) => {
    setSelectedStatuses((current) => {
      const next = current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status]
      setColumnFilters(
        next.length > 0 ? [{ id: 'displayStatus', value: next }] : [],
      )
      return next
    })
  }

  return (
    <div className='p-8'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        filters={
          <div className='flex flex-wrap items-center gap-2'>
            {statusFilters.map(({ status, label, checked }) => (
              <FilterBadge
                key={status}
                name={label}
                checked={checked}
                onClick={() => toggleStatus(status)}
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
      <CreateTrialRedeemCodeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}

export default TrialRedeemCodeTable
