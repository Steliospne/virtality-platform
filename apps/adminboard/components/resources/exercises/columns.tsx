'use client'

import { BooleanCell } from '@/components/tables/boolean-cell'
import { ColumnHeader } from '@/components/tables/header-cell'
import { Exercise } from '@virtality/db'
import { ColumnDef } from '@tanstack/react-table'
import startCase from 'lodash.startcase'
import { exerciseValueFilterFn } from '@/lib/exercise-table-filters'

export const columns: ColumnDef<Exercise>[] = [
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
    filterFn: exerciseValueFilterFn,
  },
  {
    accessorKey: 'category',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    filterFn: exerciseValueFilterFn,
  },
  {
    accessorKey: 'enabled',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    cell: ({ row }) => <BooleanCell value={row.getValue<boolean>('enabled')} />,
  },
  {
    accessorKey: 'isNew',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    cell: ({ row }) => <BooleanCell value={row.getValue<boolean>('isNew')} />,
  },
  {
    accessorKey: 'description',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
]
