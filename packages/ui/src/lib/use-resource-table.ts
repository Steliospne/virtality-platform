'use client'

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type TableOptions,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import { tableDefaults } from '@virtality/ui/lib/table-defaults'
import { useState } from 'react'

type UseResourceTableOptions<TData> = {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  enableColumnFilters?: boolean
  meta?: TableOptions<TData>['meta']
}

export function useResourceTable<TData>({
  data,
  columns,
  enableColumnFilters = false,
  meta,
}: UseResourceTableOptions<TData>) {
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
      rowSelection,
      columnVisibility,
      ...(enableColumnFilters ? { columnFilters } : {}),
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    ...(enableColumnFilters ? { onColumnFiltersChange: setColumnFilters } : {}),
    ...(meta ? { meta } : {}),
  })

  return {
    table,
    globalFilter,
    setGlobalFilter,
    setColumnFilters,
    rowSelection,
    setRowSelection,
  }
}
