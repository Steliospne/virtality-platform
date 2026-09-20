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
import { usePatientSessions } from '@virtality/react-query'
import { filterSessionsBySearch } from '@/lib/session-history'
import { buildSessionListRows } from '@/lib/session-list-row'
import { sessionsColumns } from './sessions-columns'
import type { ExtendedPatientSession } from '@/types/models'

const DEFAULT_SORTING: SortingState = [{ id: 'date', desc: true }]

interface SessionsTableProps {
  patientId: string
  onSessionSelect: (value: string) => void
  /** When provided, use this list instead of fetching (e.g. date-filtered). */
  sessions?: ExtendedPatientSession[] | null
  /** Full history for the vs-previous-session delta; defaults to `sessions`. */
  historySessions?: ExtendedPatientSession[] | null
  isLoading?: boolean
}

const SessionsTable = ({
  patientId,
  onSessionSelect,
  sessions: sessionsProp,
  historySessions,
  isLoading: isLoadingProp,
}: SessionsTableProps) => {
  'use no memo'
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING)
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const { pagination, onPaginationChange } = usePersistedPageSize('sessions')

  const { data: fetchedSessions, isPending } = usePatientSessions({
    input: {
      where: {
        patientId,
        AND: [
          { deletedAt: null },
          { status: { in: ['COMPLETED', 'INTERRUPTED'] } },
        ],
      },
    },
  })

  const usesProvidedSessions = sessionsProp !== undefined
  const tableData =
    (usesProvidedSessions ? sessionsProp : fetchedSessions) ?? []
  const rows = useMemo(() => {
    const visibleIds = new Set(
      filterSessionsBySearch(tableData, globalFilter).map((s) => s.id),
    )
    return buildSessionListRows(historySessions ?? tableData).filter((row) =>
      visibleIds.has(row.id),
    )
  }, [tableData, historySessions, globalFilter])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: sessionsColumns,
    ...tableDefaults.models,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
  })

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
        isLoading={isLoadingProp ?? (!usesProvidedSessions && isPending)}
      />
      <DataTableFooter table={table} />
    </div>
  )
}

export default SessionsTable
