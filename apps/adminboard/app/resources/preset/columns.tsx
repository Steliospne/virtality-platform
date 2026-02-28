'use client'

import DateCell from '@/components/tables/date-cell'
import { ColumnHeader } from '@/components/tables/header-cell'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deletePreset } from '@/data/server/preset'
import { getQueryClient } from '@/react-query'
import { Preset } from '@virtality/db'
import { useMutation } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import startCase from 'lodash.startcase'
import { Copy, Ellipsis, Pencil, Trash2 } from 'lucide-react'

export const columns: ColumnDef<Preset>[] = [
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
    accessorKey: 'presetName',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
  {
    accessorKey: 'pathology',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
  {
    accessorKey: 'userId',
    header: ({ header }) => <div>{startCase(header.id)}</div>,
  },
  {
    accessorKey: 'description',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
  },
  {
    accessorKey: 'deletedAt',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
  },
  {
    id: 'actions',
    cell: function ActionCell({ row }) {
      const queryClient = getQueryClient()
      const { mutate: deletePresetMutation } = useMutation({
        mutationFn: deletePreset,
        onSuccess: (data) => {
          queryClient.setQueryData(['presets'], data)
          queryClient.refetchQueries({ queryKey: ['presets'] })
        },
        mutationKey: ['deletePreset'],
      })
      const preset = row.original
      const copyId = () => {
        navigator.clipboard.writeText(preset.id)
      }

      const handleDeleteAction = () => deletePresetMutation(preset.id)

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
            <DropdownMenuItem onClick={handleDeleteAction}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
