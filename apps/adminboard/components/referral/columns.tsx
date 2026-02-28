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
import { deleteReferralCode } from '@/data/server/referral'
import { getQueryClient } from '@/react-query'
import { ReferralCode } from '@virtality/db'
import { useMutation } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import startCase from 'lodash.startcase'
import { Copy, Ellipsis, Trash2 } from 'lucide-react'

export const columns: ColumnDef<ReferralCode>[] = [
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
      const queryClient = getQueryClient()
      const { mutate: deleteReferralCodeMutation } = useMutation({
        mutationFn: deleteReferralCode,
        onSuccess: () => {
          queryClient.refetchQueries({ queryKey: ['referral'] })
        },
        mutationKey: ['deleteReferralCode'],
      })
      const referralCode = row.original
      const copyId = () => {
        navigator.clipboard.writeText(String(referralCode.id))
      }
      const copyCode = () => {
        navigator.clipboard.writeText(referralCode.code)
      }

      const handleDeleteAction = () =>
        deleteReferralCodeMutation(referralCode.id)

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
