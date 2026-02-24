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
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusSquare, Trash2 } from 'lucide-react'
import { useState } from 'react'
import usePatients from '@/hooks/queries/patient/use-patients'
import { columns } from './patients-columns'
import useDeletePatient from '@/hooks/mutations/patient/use-delete-patient'
import DeleteConfirmDialog from '@/components/ui/delete-confirm-dialog'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import useIsAuthed from '@/hooks/use-is-authed'
import { orpc } from '@/integrations/orpc/client'

const rowNavigationExceptions = [
  'div[data-slot="dialog-content"]',
  'div[data-slot="dialog-close"]',
  'div[data-slot="dialog-overlay"]',
  'div[data-slot="dropdown-menu-content"]',
  'div[data-slot="dropdown-menu-item"]',
  'div[data-slot="button"]',
]

const PatientsTable = () => {
  useIsAuthed()
  const { queryClient } = getQueryClient()
  const router = useRouter()

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data: tableData } = usePatients()

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

  const { mutate: deletePatients } = useDeletePatient({
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: orpc.patient.list.key(),
      }),
  })

  const deleteSelectedHandler = () => {
    const ids = selectedRow?.map((d) => d.id)
    if (!ids) return
    for (const id of ids) {
      deletePatients({ id })
    }
  }

  const rowNavigation = (id: string) => {
    router.push(`/patients/${id}/patient-dashboard`)
  }

  return (
    <div className='h-screen-with-header flex flex-col p-8'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      >
        {selectedRow?.length !== 0 && (
          <DeleteConfirmDialog
            title={'Delete Selected Patients'}
            description={
              'Are you sure you want to delete these patients? This action cannot be undone.'
            }
            onConfirm={deleteSelectedHandler}
            asChild
          >
            <Button variant='destructive' className='mr-auto'>
              <Trash2 />
              Delete Selected
            </Button>
          </DeleteConfirmDialog>
        )}
        <Button id='new-program' asChild variant='primary' className='ml-auto'>
          <Link href={`/patients/new`}>
            <PlusSquare /> {'New Patient'}
          </Link>
        </Button>
      </DataTableHeader>
      <DataTableBody
        table={table}
        columns={columns}
        rowNavigation={rowNavigation}
        rowNavigationExceptions={rowNavigationExceptions}
        className='flex-1'
      />
      <DataTableFooter table={table} />
    </div>
  )
}

export default PatientsTable
