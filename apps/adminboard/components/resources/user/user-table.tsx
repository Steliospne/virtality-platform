'use client'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@/components/tables/data-table'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { tableDefaults } from '@/tanstack-tables'
import useUserList from '@/hooks/use-users'
import { columns } from './columns'

const UserTableDAL = () => {
  const { data } = useUserList()

  return <UserTable data={data?.data?.users ?? []} columns={columns} />
}

export default UserTableDAL

interface UserTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

const UserTable = <TData, TValue>({
  data,
  columns,
}: UserTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    ...tableDefaults.models,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      rowSelection,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
  })

  return (
    <div className='p-8'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <DataTableBody table={table} columns={columns} rowNavigation />
      <DataTableFooter table={table} />
    </div>
  )
}
