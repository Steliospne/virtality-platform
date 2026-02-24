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
import { PlusSquare, Trash2 } from 'lucide-react'
import { Preset } from '@virtality/db'
import usePresetsByUser from '@/hooks/queries/preset/use-preset-by-user'
import DeleteConfirmDialog from '@/components/ui/delete-confirm-dialog'
import useDeletePreset from '@/hooks/mutations/preset/use-delete-preset'
import { orpc } from '@/integrations/orpc/client'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import { useRouter } from 'next/navigation'

interface UserPresetsTableProps {
  columns: ColumnDef<Preset>[]
  data?: Preset[]
}

export default function UserPresetsTable({ columns }: UserPresetsTableProps) {
  const { queryClient } = getQueryClient()
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data: tableData } = usePresetsByUser({})

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

  const { mutate: deletePreset } = useDeletePreset({
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: orpc.preset.listUser.key(),
      }),
  })

  const deleteSelectedHandler = () => {
    const ids = selectedRow?.map((d) => d.id)
    if (!ids) return
    for (const id of ids) {
      deletePreset({ id })
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
          <DeleteConfirmDialog
            title={'Delete Selected Presets'}
            description={
              'Are you sure you want to delete these presets? This action cannot be undone.'
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
        <Button id='new-preset' asChild variant='primary' className='ml-auto'>
          <Link href={`/presets/new`}>
            <PlusSquare /> {'New Preset'}
          </Link>
        </Button>
      </DataTableHeader>
      <DataTableBody
        table={table}
        columns={columns}
        className='flex-1'
        rowNavigation={(id: string) => router.push(`/presets/${id}/edit`)}
      />
      <DataTableFooter table={table} />
    </div>
  )
}
