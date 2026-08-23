'use client'

import { createCustomerColumns } from '@/components/customer/customer-columns'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { useAdminCustomers } from '@virtality/react-query'
import type { AdminCustomerListItem } from '@virtality/shared/utils'
import { useMemo } from 'react'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'

type CustomerTableProps = {
  onViewProfile: (customer: AdminCustomerListItem) => void
}

export function CustomerTable({ onViewProfile }: CustomerTableProps) {
  const { data, isPending } = useAdminCustomers()
  const columns = useMemo(
    () => createCustomerColumns({ onViewProfile }),
    [onViewProfile],
  )
  const { table, globalFilter, setGlobalFilter } = useResourceTable({
    data: data ?? [],
    columns,
    getRowId: (row) => row.userId,
  })

  return (
    <div className='grid gap-4'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <DataTableBody table={table} columns={columns} isLoading={isPending} />
      <DataTableFooter table={table} />
    </div>
  )
}
