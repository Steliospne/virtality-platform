'use client'

import {
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { tableDefaults } from '@/components/tables/tanstack-table'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@/components/tables/data-table'
import { useState } from 'react'
import usePatientSessions from '@/hooks/queries/patient-session/use-patient-sessions'
import { sessionsColumns } from './sessions-columns'

interface SessionsTableProps {
  patientId: string
  onSessionSelect: (value: string) => void
}

const SessionsTable = ({ patientId, onSessionSelect }: SessionsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data: tableData } = usePatientSessions({ patientId })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tableData ?? [],
    columns: sessionsColumns,
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

  // const selectedRow = tableData?.filter((_, index) =>
  //   Object.keys(rowSelection)?.includes(String(index)),
  // )

  const rowNavigation = (id: string) => {
    onSessionSelect(id)
  }

  return (
    <div className='flex flex-1 flex-col px-4'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <DataTableBody
        table={table}
        columns={sessionsColumns}
        rowNavigation={rowNavigation}
        className='flex-1'
      />
      <DataTableFooter table={table} />
    </div>
  )
}

export default SessionsTable
