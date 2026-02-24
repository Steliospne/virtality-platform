'use client'

import { Button } from '@/components/ui/button'
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
import DateCell from '@/components/tables/date-cell'
import { Patient } from '@virtality/db'
import useDeletePatient from '@/hooks/mutations/patient/use-delete-patient'
import DeleteConfirmDialog from '@/components/ui/delete-confirm-dialog'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import { orpc } from '@/integrations/orpc/client'

export const columns: ColumnDef<Patient>[] = [
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
    accessorKey: 'id',
    cell({ row }) {
      const id: string = row.getValue('id')
      return <div>{id.split('-')[0]}</div>
    },
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
    accessorKey: 'phone',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={header.id} className='capitalize' />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={header.id} className='capitalize' />
    ),
    cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column, header }) => (
      <ColumnHeader
        column={column}
        title={header.id}
        className='*:capitalize'
      />
    ),
    cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: function ActionCell({ row }) {
      const { queryClient } = getQueryClient()
      const router = useRouter()
      const patient = row.original

      const [open, setOpen] = useState(false)

      const { mutate: deletePatient } = useDeletePatient({
        onSuccess: () => {
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
