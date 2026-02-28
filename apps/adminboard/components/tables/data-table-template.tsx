/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { useState } from 'react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
  })

  const isColumnMissing =
    table.getAllColumns().length > table.getVisibleLeafColumns().length

  return (
    <div className='p-8'>
      {/* <DataTableHeader
        table={table}
        isColumnMissing={isColumnMissing}
        globalFilter={globalFilter}
        setGlobalFilter={(val: string) => table.setGlobalFilter(val)}
      />
      <DataTableBody table={table} columns={columns} />
      <DataTableFooter table={table} /> */}
    </div>
  )
}
