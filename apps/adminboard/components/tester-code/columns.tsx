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
import {
  getQueryClient,
  useDeleteTesterCode,
  useORPC,
} from '@virtality/react-query'
import { TesterCode } from '@virtality/db'
import { ColumnDef } from '@tanstack/react-table'
import startCase from 'lodash.startcase'
import { Copy, Ellipsis, Trash2 } from 'lucide-react'

export const columns: ColumnDef<TesterCode>[] = [
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
      const id = row.getValue('id') as number | string
      return <div>{typeof id === 'string' ? id.split('-')[0] : String(id)}</div>
    },
  },
  {
    accessorKey: 'code',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
  {
    accessorKey: 'usedAt',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
  },
  {
    accessorKey: 'usedBy',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    cell: ({ row }) => {
      const usedBy = row.getValue('usedBy') as string | null
      return <div>{usedBy || '-'}</div>
    },
  },
  {
    id: 'actions',
    cell: function ActionCell({ row }) {
      const orpc = useORPC()
      const { mutate: deleteTesterCodeMutation } = useDeleteTesterCode({
        onSuccess: () => {
          getQueryClient().invalidateQueries({
            queryKey: orpc.testerCode.list.key(),
          })
        },
      })
      const testerCode = row.original
      const copyId = () => {
        navigator.clipboard.writeText(String(testerCode.id))
      }
      const copyCode = () => {
        navigator.clipboard.writeText(testerCode.code)
      }

      const handleDeleteAction = () =>
        deleteTesterCodeMutation({ id: testerCode.id })

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
            <DropdownMenuItem onClick={copyCode}>
              <Copy />
              Copy Code
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
