'use client'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@/components/tables/data-table'
// button imported in header via PresetForm
import {
  ColumnDef,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { useState } from 'react'
import PresetPopover from './preset-popover'
import { columns } from '@/app/resources/preset/columns'
import { tableDefaults } from '@/tanstack-tables'
import { usePresets } from '@virtality/react-query'

const PresetTableDAL = () => {
  const { data, isPending } = usePresets()
  if (isPending) return <div className='p-8'>Loading...</div>
  return <PresetTable columns={columns} data={data ?? []} />
}

export default PresetTableDAL

interface PresetTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

const PresetTable = <TData, TValue>({
  data,
  columns,
}: PresetTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    ...tableDefaults.models,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
  })

  return (
    <div className='p-8'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      >
        <PresetPopover />
      </DataTableHeader>
      <DataTableBody table={table} columns={columns} rowNavigation />
      <DataTableFooter table={table} />
    </div>
  )
}
