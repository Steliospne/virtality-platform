'use client'
import {
  ColumnDef,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { tableDefaults } from '@/components/tables/tanstack-table'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@/components/tables/data-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusSquare } from 'lucide-react'
import usePresets from '@/hooks/queries/preset/use-presets'
import { Preset } from '@virtality/db'

interface PresetTableProps {
  columns: ColumnDef<Preset>[]
  data?: Preset[]
}

export default function PresetTable({ columns }: PresetTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data: tableData } = usePresets()

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tableData ?? [],
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

  const selectedRow = tableData?.filter((_, index) =>
    Object.keys(rowSelection)?.includes(String(index)),
  )

  return (
    <div className='h-screen-with-nav flex flex-col p-8'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      >
        {selectedRow?.length !== 0 && null}
        <Button id='new-preset' asChild variant='primary' className='ml-auto'>
          <Link href={`/presets/new`}>
            <PlusSquare /> {'New Preset'}
          </Link>
        </Button>
      </DataTableHeader>
      <DataTableBody table={table} columns={columns} className='flex-1' />
      <DataTableFooter table={table} />
    </div>
  )
}
