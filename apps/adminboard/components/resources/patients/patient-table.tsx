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
import { columns } from './columns'
import { tableDefaults } from '@/tanstack-tables'
import usePatientList from '@/hooks/use-patient'

const PatientTableDAL = () => {
  const { data } = usePatientList()
  return <PatientTable columns={columns} data={data ?? []} />
}

export default PatientTableDAL

interface PatientTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

const PatientTable = <TData, TValue>({
  data,
  columns,
}: PatientTableProps<TData, TValue>) => {
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
