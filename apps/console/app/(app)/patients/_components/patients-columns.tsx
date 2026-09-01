'use client'

import { Button } from '@virtality/ui/components/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { Copy, Ellipsis, Pencil, Trash2 } from 'lucide-react'
import ColumnHeader from '@/components/tables/header-cell'
import { format } from 'date-fns'
import { PatientListItem } from '@/types/models'
import DeleteConfirmDialog from '@/components/ui/delete-confirm-dialog'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useDeletePatient,
  useORPC,
  getQueryClient,
} from '@virtality/react-query'
import { trackAnalyticsEvent } from '@/lib/analytics-contract'

export const columns: ColumnDef<PatientListItem>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        id='select'
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: '#',
    cell: ({ cell }) => <div>{cell.row.index + 1}</div>,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={header.id} className='capitalize' />
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={header.id} className='capitalize' />
    ),
  },
  {
    accessorKey: 'activeProgramName',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Active Program'
        className='capitalize'
      />
    ),
    cell: ({ row }) => {
      const name: string | null = row.getValue('activeProgramName')
      return <div>{name ?? '—'}</div>
    },
  },
  {
    accessorKey: 'totalSessions',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Total Sessions'
        className='capitalize'
      />
    ),
  },
  {
    accessorKey: 'lastSessionAt',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Last Session'
        className='capitalize'
      />
    ),
    cell: ({ row }) => {
      const date: Date | null = row.getValue('lastSessionAt')
      if (!date) return <div>No sessions yet</div>
      return <div>{format(date, 'PPP')}</div>
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: function ActionCell({ row }) {
      const queryClient = getQueryClient()
      const orpc = useORPC()
      const router = useRouter()
      const patient = row.original

      const [open, setOpen] = useState(false)

      const { mutate: deletePatient } = useDeletePatient({
        onSuccess: () => {
          trackAnalyticsEvent('patient_deleted', {})
          return queryClient.invalidateQueries({
            queryKey: orpc.patient.list.key(),
          })
        },
      })

      const copyId = () => {
        navigator.clipboard.writeText(patient.id)
      }

      const editHandler = () => {
        router.push(`/patients/${patient.id}/profile`)
      }

      const handleConfirmDelete = () => {
        deletePatient({ id: patient.id })
      }

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id='actions'
                size='icon'
                variant='ghost'
                className='size-6'
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent id='actions'>
              <DropdownMenuItem onClick={copyId}>
                <Copy />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={editHandler}>
                <Pencil />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                variant='destructive'
                onClick={() => setOpen(true)}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DeleteConfirmDialog
            title={'Delete Patient'}
            description={
              <>
                Are you sure you want to delete <strong>{patient.name}</strong>?
                This action cannot be undone.
              </>
            }
            open={open}
            onOpenChange={setOpen}
            onConfirm={handleConfirmDelete}
          />
        </>
      )
    },
  },
]
