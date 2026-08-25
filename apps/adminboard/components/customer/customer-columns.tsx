'use client'

import DateCell from '@/components/tables/date-cell'
import { ColumnHeader } from '@/components/tables/header-cell'
import {
  formatCustomerAccessStatus,
  formatCustomerBillingStatus,
} from '@/lib/admin-customer-display'
import type { AdminCustomerListItem } from '@virtality/shared/utils'
import { ColumnDef } from '@tanstack/react-table'
import startCase from 'lodash.startcase'

export function createCustomerColumns(): ColumnDef<AdminCustomerListItem>[] {
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
  ]
}
