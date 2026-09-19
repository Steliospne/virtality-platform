'use client'

import {
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { tableDefaults } from '@virtality/ui/lib/table-defaults'
import { usePersistedPageSize } from '@virtality/ui/lib/use-persisted-page-size'
import { useMemo, useState } from 'react'
import { useReusablePrograms } from '@virtality/react-query'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'
import { filterProgramsBySearch } from '@/lib/program-library'
import { programLibraryColumns } from './columns'
import { Button } from '@virtality/ui/components/button'
import Link from 'next/link'
import { PlusSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProgramLibraryTable() {
  usePageViewTracking({
    props: { route_group: 'program', tab_view: 'program-library' },
  })
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const { pagination, onPaginationChange } =
    usePersistedPageSize('program-library')

  const { data: programs, isPending } = useReusablePrograms()
  const filteredPrograms = useMemo(
    () => filterProgramsBySearch(programs ?? [], globalFilter),
    [programs, globalFilter],
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredPrograms,
    columns: programLibraryColumns,
    ...tableDefaults.models,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
  })

  const rowNavigation = (id: string) => {
    router.push(`/programs/${id}/edit`)
  }

  return (
    <div className='h-screen-with-nav flex flex-col p-8'>
      <div className='mb-4'>
        <h1 className='text-2xl font-semibold'>Program Library</h1>
        <p className='text-muted-foreground text-sm'>
          Browse and manage your reusable therapy programs.
        </p>
      </div>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      >
        <Button id='new-program' asChild variant='primary' className='ml-auto'>
          <Link href='/programs/new'>
            <PlusSquare /> New program
          </Link>
        </Button>
      </DataTableHeader>
      <DataTableBody
        table={table}
        columns={programLibraryColumns}
        rowNavigation={rowNavigation}
        className='flex-1'
        isLoading={isPending}
      />
      <DataTableFooter table={table} />
    </div>
  )
}
