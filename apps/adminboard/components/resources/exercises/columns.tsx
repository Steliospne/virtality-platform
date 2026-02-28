'use client'

import { ColumnHeader } from '@/components/tables/header-cell'
import { Checkbox } from '@/components/ui/checkbox'
import { Exercise } from '@virtality/db'
import { ColumnDef } from '@tanstack/react-table'
import startCase from 'lodash.startcase'

export const columns: ColumnDef<Exercise>[] = [
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
    accessorKey: 'displayName',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
  {
    accessorKey: 'direction',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
  {
    accessorKey: 'enabled',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
  {
    accessorKey: 'isNew',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
]
