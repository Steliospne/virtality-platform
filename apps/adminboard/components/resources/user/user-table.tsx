'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { UserWithRole } from 'better-auth/plugins/admin'
import { useUsers } from '@virtality/react-query'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'
import { columns } from './columns'

const UserTable = () => {
  const { data, isPending } = useUsers()
  const users = (data?.data?.users ?? []) as UserWithRole[]
  const { table, globalFilter, setGlobalFilter } = useResourceTable({
    data: users,
    columns,
    enableColumnFilters: true,
  })

  return (
    <div className='p-8'>
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

export default UserTable
