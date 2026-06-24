'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { useMap } from '@virtality/react-query'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'
import { columns } from './columns'

const MapTable = () => {
  const { data, isPending } = useMap()
  const { table, globalFilter, setGlobalFilter } = useResourceTable({
    data: data ?? [],
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

export default MapTable
