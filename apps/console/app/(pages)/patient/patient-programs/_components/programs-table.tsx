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
import usePatientPrograms from '@/hooks/queries/patient-program/use-patient-programs'
import { CompletePatientProgram } from '@/types/models'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusSquare, Trash2 } from 'lucide-react'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import { orpc } from '@/integrations/orpc/client'
import useDeletePatientProgram from '@/hooks/mutations/program/use-delete-program'

interface ProgramsTableProps {
  columns: ColumnDef<CompletePatientProgram>[]
  data?: CompletePatientProgram[]
  patientId: string
}

export function ProgramsTable({ columns, patientId }: ProgramsTableProps) {
  const { queryClient } = getQueryClient()
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data: tableData } = usePatientPrograms({ patientId })

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

  const { mutate: deleteSelected } = useDeletePatientProgram({
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: orpc.program.list.key(),
      }),
  })

  const deleteSelectedHandler = () => {
    const ids = selectedRow?.map((d) => d.id)
    if (!ids) return
    for (const id of ids) {
      deleteSelected({ id })
    }
  }

  return (
    <div className='h-screen-with-nav flex flex-col p-8'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      >
        {selectedRow?.length !== 0 && (
          <Button
            variant='destructive'
            className='mr-auto'
            onClick={deleteSelectedHandler}
          >
            <Trash2 />
            Delete Selected
          </Button>
        )}
        <Button id='new-program' asChild variant='primary' className='ml-auto'>
          <Link href={`/patients/${patientId}/programs/new`}>
            <PlusSquare /> {'New Program'}
          </Link>
        </Button>
      </DataTableHeader>
      <DataTableBody
        table={table}
        columns={columns}
        rowNavigation={(id: string) =>
          router.push(`/patients/${patientId}/programs/${id}/edit`)
        }
        className='flex-1'
      />
      <DataTableFooter table={table} />
    </div>
  )
}
