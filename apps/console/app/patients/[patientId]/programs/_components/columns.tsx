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
import { CompletePatientProgram } from '@/types/models'
import {
  getQueryClient,
  useORPC,
  useDeleteProgram,
} from '@virtality/react-query'

export const columns: ColumnDef<CompletePatientProgram>[] = [
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
      const queryClient = getQueryClient()
      const orpc = useORPC()
      const program = row.original
      const { mutate: deleteProgram } = useDeleteProgram({
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: orpc.program.list.key(),
          }),
      })

      const copyId = () => {
        navigator.clipboard.writeText(program.id)
      }

      const handleDeleteAction = () => deleteProgram({ id: program.id })

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size='icon' variant='ghost' className='size-6'>
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent id='actions'>
            <DropdownMenuItem onClick={copyId}>
              <Copy />
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDeleteAction}
              variant='destructive'
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
