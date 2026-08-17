'use client'

import DateCell from '@/components/tables/date-cell'
import { ColumnHeader } from '@/components/tables/header-cell'
import { NotifyPromotionCodeDialog } from '@/components/promotion-code/notify-promotion-code-dialog'
import { SendPromotionCodeEmailDialog } from '@/components/promotion-code/send-promotion-code-email-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDropdownMenu } from '@/hooks/use-dropdown-menu-action'
import {
  formatPromotionCodeExpiresAt,
  formatPromotionCodeMaxRedemptions,
  formatPromotionCodeStatus,
} from '@/lib/promotion-code-display'
import { getErrorMessage } from '@/lib/get-error-message'
import { useDeactivatePromotionCode } from '@virtality/react-query'
import type { PromotionCodeRecord } from '@virtality/shared/utils'
import { ColumnDef } from '@tanstack/react-table'
import { Ban, Bell, Copy, Ellipsis, Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function createPromotionCodeColumns(
  couponId: string,
): ColumnDef<PromotionCodeRecord>[] {
  return [
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
      accessorKey: 'code',
      header: ({ column }) => <ColumnHeader column={column} title='Code' />,
      cell: ({ row }) => <div className='font-mono'>{row.original.code}</div>,
    },
    {
      accessorKey: 'active',
      header: ({ column }) => <ColumnHeader column={column} title='Status' />,
      cell: ({ row }) => <div>{formatPromotionCodeStatus(row.original)}</div>,
      filterFn: (row, _columnId, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true
        const status = row.original.active ? 'active' : 'inactive'
        return filterValue.includes(status)
      },
    },
    {
      id: 'expiresAt',
      header: ({ column }) => <ColumnHeader column={column} title='Expires' />,
      cell: ({ row }) => (
        <div>{formatPromotionCodeExpiresAt(row.original)}</div>
      ),
    },
    {
      id: 'maxRedemptions',
      header: ({ column }) => (
        <ColumnHeader column={column} title='Max redemptions' />
      ),
      cell: ({ row }) => (
        <div>{formatPromotionCodeMaxRedemptions(row.original)}</div>
      ),
    },
    {
      accessorKey: 'timesRedeemed',
      header: ({ column }) => (
        <ColumnHeader column={column} title='Times redeemed' />
      ),
    },
    {
      id: 'createdAt',
      header: ({ column }) => <ColumnHeader column={column} title='Created' />,
      accessorFn: (row) => new Date(row.created * 1000),
      cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
    },
    {
      id: 'actions',
      cell: function ActionCell({ row }) {
        const promotionCode = row.original
        const { open, setOpen, runAfterClose } = useDropdownMenu()
        const [sendOpen, setSendOpen] = useState(false)
        const [notifyOpen, setNotifyOpen] = useState(false)
        const { mutate: deactivatePromotionCode } =
          useDeactivatePromotionCode(couponId)

        const copyCode = () => {
          void navigator.clipboard.writeText(promotionCode.code)
          toast.success('Code copied')
        }

        const handleDeactivate = () =>
          deactivatePromotionCode(
            { id: promotionCode.id },
            {
              onSuccess: () => toast.success('Promotion Code deactivated'),
              onError: (error) =>
                toast.error(
                  getErrorMessage(error, 'Failed to deactivate Promotion Code'),
                ),
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
                {promotionCode.active ? (
                  <>
                    <DropdownMenuItem
                      onSelect={() => runAfterClose(() => setSendOpen(true))}
                    >
                      <Mail />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => runAfterClose(() => setNotifyOpen(true))}
                    >
                      <Bell />
                      In-app notify
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleDeactivate}>
                      <Ban />
                      Deactivate
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <SendPromotionCodeEmailDialog
              open={sendOpen}
              onOpenChange={setSendOpen}
              promotionCode={promotionCode}
            />
            <NotifyPromotionCodeDialog
              open={notifyOpen}
              onOpenChange={setNotifyOpen}
              promotionCode={promotionCode}
            />
          </>
        )
      },
    },
  ]
}
