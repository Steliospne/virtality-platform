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
import { columns } from '@/components/resources/exercises/columns'
import useSuspenseExercise from '@/hooks/use-suspense-exercise'
import { tableDefaults } from '@/tanstack-tables'
import FilterBadge from '@/components/ui/filter-badge'

const ExerciseTableDAL = () => {
  const { data } = useSuspenseExercise()
  return <ExerciseTable columns={columns} data={data} />
}

export default ExerciseTableDAL

interface ExerciseTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

const ExerciseTable = <TData, TValue>({
  data,
  columns,
}: ExerciseTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [enabledFilter, setEnabledFilter] = useState(false)

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

  const handleEnabledFilter = () => {
    setEnabledFilter(!enabledFilter)
    setColumnFilters([{ id: 'enabled', value: enabledFilter ? true : false }])
  }

  return (
    <div className='p-8'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        filters={
          <FilterBadge
            name='enabled'
            checked={enabledFilter}
            onClick={handleEnabledFilter}
          />
        }
      />
      <DataTableBody table={table} columns={columns} rowNavigation />
      <DataTableFooter table={table} />
    </div>
  )
}
