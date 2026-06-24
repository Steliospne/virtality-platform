'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'
import { usePatientSessions } from '@virtality/react-query'
import { sessionsColumns } from './sessions-columns'
import type { ExtendedPatientSession } from '@/types/models'

interface SessionsTableProps {
  patientId: string
  onSessionSelect: (value: string) => void
  /** When provided, use this list instead of fetching (e.g. date-filtered). */
  sessions?: ExtendedPatientSession[] | null
}

const SessionsTable = ({
  patientId,
  onSessionSelect,
  sessions: sessionsProp,
}: SessionsTableProps) => {
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

  const { table, globalFilter, setGlobalFilter } = useResourceTable({
    data: tableData,
    columns: sessionsColumns,
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
        isLoading={!usesProvidedSessions && isPending}
      />
      <DataTableFooter table={table} />
    </div>
  )
}

export default SessionsTable
