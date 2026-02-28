import DateCell from '@/components/tables/date-cell'
import { ColumnHeader } from '@/components/tables/header-cell'
import { Checkbox } from '@/components/ui/checkbox'
import { ColumnDef } from '@tanstack/react-table'
import { UserWithRole } from 'better-auth/plugins/admin'
import startCase from 'lodash.startcase'

export const columns: ColumnDef<UserWithRole>[] = [
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
      return <div>{id}</div>
    },
  },
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
    accessorKey: 'role',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={startCase(header.id)} />
    ),
    cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
  },
]
