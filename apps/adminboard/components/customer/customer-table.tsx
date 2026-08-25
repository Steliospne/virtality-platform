'use client'

import { createCustomerColumns } from '@/components/customer/customer-columns'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { useAdminCustomers } from '@virtality/react-query'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'

export function CustomerTable() {
  const router = useRouter()
  const { data, isPending } = useAdminCustomers()
  const columns = useMemo(() => createCustomerColumns(), [])
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
      <DataTableBody
        table={table}
        columns={columns}
        rowNavigation={(userId) => {
          router.push(`/customers/${userId}`)
        }}
        isLoading={isPending}
      />
      <DataTableFooter table={table} />
    </div>
  )
}
