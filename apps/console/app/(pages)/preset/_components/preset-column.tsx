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
import useDeletePreset from '@/hooks/mutations/preset/use-delete-preset'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import { orpc } from '@/integrations/orpc/client'
import { Preset } from '@virtality/db'

export const presetColumns: ColumnDef<Preset>[] = [
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
    cell: ({ row }) => <div>{row.original.presetName}</div>,
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
      'use no memo'
      const { queryClient } = getQueryClient()
      const preset = row.original
      const { mutate: deletePreset } = useDeletePreset({
        onSuccess: () =>
          Promise.all([
            queryClient.invalidateQueries({
              queryKey: orpc.preset.list.key(),
            }),
            queryClient.invalidateQueries({
              queryKey: orpc.preset.listUser.key(),
            }),
          ]),
      })

      const copyId = () => {
        navigator.clipboard.writeText(preset.id)
      }

      const handleDeleteAction = () => deletePreset({ id: preset.id })

      const isUserPreset = row.original.userId === null ? false : true

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
              disabled={!isUserPreset}
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
