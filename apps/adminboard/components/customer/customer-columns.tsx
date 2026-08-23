'use client'

import DateCell from '@/components/tables/date-cell'
import { ColumnHeader } from '@/components/tables/header-cell'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDropdownMenu } from '@/hooks/use-dropdown-menu-action'
import {
  formatCustomerAccessStatus,
  formatCustomerBillingStatus,
} from '@/lib/admin-customer-display'
import type { AdminCustomerListItem } from '@virtality/shared/utils'
import { ColumnDef } from '@tanstack/react-table'
import { Ellipsis, UserRound } from 'lucide-react'
import startCase from 'lodash.startcase'

type CustomerColumnsOptions = {
  onViewProfile: (customer: AdminCustomerListItem) => void
}

export function createCustomerColumns({
  onViewProfile,
}: CustomerColumnsOptions): ColumnDef<AdminCustomerListItem>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column, header }) => (
        <ColumnHeader column={column} title={startCase(header.id)} />
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column, header }) => (
        <ColumnHeader column={column} title={startCase(header.id)} />
      ),
    },
    {
      accessorKey: 'accessStatus',
      header: ({ column }) => <ColumnHeader column={column} title='Access' />,
      cell: ({ row }) => (
        <div>{formatCustomerAccessStatus(row.original.accessStatus)}</div>
      ),
    },
    {
      accessorKey: 'billingStatus',
      header: ({ column }) => <ColumnHeader column={column} title='Billing' />,
      cell: ({ row }) => (
        <div>{formatCustomerBillingStatus(row.original.billingStatus)}</div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column, header }) => (
        <ColumnHeader column={column} title={startCase(header.id)} />
      ),
      cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
    },
    {
      id: 'actions',
      cell: function ActionCell({ row }) {
        const customer = row.original
        const { open, setOpen, runAfterClose } = useDropdownMenu()

        return (
          <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size='icon' variant='ghost' className='size-6'>
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onSelect={() => runAfterClose(() => onViewProfile(customer))}
              >
                <UserRound />
                View profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
