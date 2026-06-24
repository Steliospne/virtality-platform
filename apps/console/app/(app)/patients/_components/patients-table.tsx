'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'
import { useRouter } from 'next/navigation'
import { Button } from '@virtality/ui/components/button'
import Link from 'next/link'
import { PlusSquare, Trash2 } from 'lucide-react'
import { columns } from './patients-columns'
import DeleteConfirmDialog from '@/components/ui/delete-confirm-dialog'
import useIsAuthed from '@/hooks/use-is-authed'
import {
  usePatients,
  useDeletePatient,
  useORPC,
  getQueryClient,
} from '@virtality/react-query'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'
import { trackAnalyticsEvent } from '@/lib/analytics-contract'

const PatientsTable = () => {
  useIsAuthed()
  usePageViewTracking({ props: { route_group: 'patient' } })
  const queryClient = getQueryClient()
  const orpc = useORPC()
  const router = useRouter()

  const { data: tableData, isPending } = usePatients()

  const {
    table,
    globalFilter,
    setGlobalFilter,
    rowSelection,
    setRowSelection,
  } = useResourceTable({
    data: tableData ?? [],
    columns,
  })

  const selectedRow = tableData?.filter((_, index) =>
    Object.keys(rowSelection)?.includes(String(index)),
  )

  const { mutate: deletePatients } = useDeletePatient({
    onSuccess: () => {
      trackAnalyticsEvent('patient_deleted', {})
      setRowSelection({})
      return queryClient.invalidateQueries({
        queryKey: orpc.patient.list.key(),
      })
    },
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
        {selectedRow && selectedRow.length !== 0 && (
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
        className='flex-1'
        isLoading={isPending}
      />
      <DataTableFooter table={table} />
    </div>
  )
}

export default PatientsTable
