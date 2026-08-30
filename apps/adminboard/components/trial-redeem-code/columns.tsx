'use client'

import DateCell from '@/components/tables/date-cell'
import { ColumnHeader } from '@/components/tables/header-cell'
import { SendTrialRedeemCodeEmailDialog } from '@/components/trial-redeem-code/send-trial-redeem-code-email-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDropdownMenu } from '@/hooks/use-dropdown-menu-action'
import { useDeleteTrialRedeemCode } from '@virtality/react-query'
import {
  TRIAL_REDEEM_DISPLAY_STATUS_LABELS,
  type TrialRedeemCodeListItem,
} from '@virtality/shared/utils'
import { ColumnDef } from '@tanstack/react-table'
import startCase from 'lodash.startcase'
import { Copy, Ellipsis, Mail, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const columns: ColumnDef<TrialRedeemCodeListItem>[] = [
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
      return <div>{String(row.getValue('id'))}</div>
    },
  },
  {
    accessorKey: 'code',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
  {
    accessorKey: 'displayStatus',
    header: ({ column }) => <ColumnHeader column={column} title='Status' />,
    cell: ({ row }) => {
      const status = row.original.displayStatus
      return <div>{TRIAL_REDEEM_DISPLAY_STATUS_LABELS[status]}</div>
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!Array.isArray(filterValue) || filterValue.length === 0) return true
      return filterValue.includes(row.original.displayStatus)
    },
  },
  {
    accessorKey: 'trialDays',
    header: ({ column }) => <ColumnHeader column={column} title='Trial days' />,
  },
  {
    accessorKey: 'note',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    cell: ({ row }) => {
      const note = row.getValue('note') as string | null
      return <div>{note || '-'}</div>
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
  },
  {
    accessorKey: 'usedAt',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
  },
  {
    id: 'actions',
    cell: function ActionCell({ row }) {
      const { mutate: deleteTrialRedeemCodeMutation } =
        useDeleteTrialRedeemCode()
      const { open, setOpen, runAfterClose } = useDropdownMenu()
      const [sendOpen, setSendOpen] = useState(false)
      const trialRedeemCode = row.original
      const canSend = trialRedeemCode.displayStatus === 'unused'

      const copyCode = () => {
        void navigator.clipboard.writeText(trialRedeemCode.code)
        toast.success('Code copied')
      }

      const handleDeleteAction = () =>
        deleteTrialRedeemCodeMutation(
          { id: trialRedeemCode.id },
          {
            onSuccess: () => toast.success('Access Code deleted'),
            onError: () => toast.error('Failed to delete Access Code'),
          },
        )

      return (
        <>
          <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size='icon' variant='ghost' className='size-6'>
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent id='actions'>
              <DropdownMenuItem onSelect={copyCode}>
                <Copy />
                Copy Code
              </DropdownMenuItem>
              {canSend ? (
                <DropdownMenuItem
                  onSelect={() => runAfterClose(() => setSendOpen(true))}
                >
                  <Mail />
                  Send Email
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={handleDeleteAction}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SendTrialRedeemCodeEmailDialog
            open={sendOpen}
            onOpenChange={setSendOpen}
            trialRedeemCode={trialRedeemCode}
          />
        </>
      )
    },
  },
]
