'use client'

import DateCell from '@/components/tables/date-cell'
import { ColumnHeader } from '@/components/tables/header-cell'
import { DeleteLibraryCouponDialog } from '@/components/coupon-library/delete-library-coupon-dialog'
import { EditLibraryCouponNameDialog } from '@/components/coupon-library/edit-library-coupon-name-dialog'
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
  formatCouponAppliesTo,
  formatCouponDiscount,
  formatCouponDuration,
} from '@/lib/coupon-library-display'
import { getErrorMessage } from '@/lib/get-error-message'
import { useArchiveLibraryCoupon } from '@virtality/react-query'
import type { CouponLibraryRecord } from '@virtality/shared/utils'
import { ColumnDef } from '@tanstack/react-table'
import { Archive, Ellipsis, Pencil, Tag, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

export const columns: ColumnDef<CouponLibraryRecord>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => <ColumnHeader column={column} title='Name' />,
    cell: ({ row }) => <div>{row.original.name ?? row.original.id}</div>,
  },
  {
    id: 'discount',
    header: ({ column }) => <ColumnHeader column={column} title='Discount' />,
    cell: ({ row }) => <div>{formatCouponDiscount(row.original)}</div>,
  },
  {
    id: 'duration',
    header: ({ column }) => <ColumnHeader column={column} title='Duration' />,
    cell: ({ row }) => <div>{formatCouponDuration(row.original)}</div>,
  },
  {
    id: 'appliesTo',
    header: ({ column }) => <ColumnHeader column={column} title='Applies to' />,
    cell: ({ row }) => <div>{formatCouponAppliesTo(row.original)}</div>,
  },
  {
    accessorKey: 'archived',
    header: ({ column }) => <ColumnHeader column={column} title='Status' />,
    cell: ({ row }) => (
      <div>{row.original.archived ? 'Archived' : 'Active'}</div>
    ),
    filterFn: (row, _columnId, filterValue) => {
      if (!Array.isArray(filterValue) || filterValue.length === 0) return true
      const status = row.original.archived ? 'archived' : 'active'
      return filterValue.includes(status)
    },
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
      const coupon = row.original
      const { open, setOpen, runAfterClose } = useDropdownMenu()
      const [editOpen, setEditOpen] = useState(false)
      const [deleteOpen, setDeleteOpen] = useState(false)
      const { mutate: archiveLibraryCoupon } = useArchiveLibraryCoupon()

      const handleArchive = () =>
        archiveLibraryCoupon(
          { id: coupon.id },
          {
            onSuccess: () => toast.success('Coupon archived'),
            onError: (error) =>
              toast.error(getErrorMessage(error, 'Failed to archive Coupon')),
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
              <DropdownMenuItem asChild>
                <Link href={`/coupons/${coupon.id}`}>
                  <Tag />
                  Promotion Codes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => runAfterClose(() => setEditOpen(true))}
              >
                <Pencil />
                Edit name
              </DropdownMenuItem>
              {!coupon.archived ? (
                <DropdownMenuItem onSelect={handleArchive}>
                  <Archive />
                  Archive
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onSelect={() => runAfterClose(() => setDeleteOpen(true))}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <EditLibraryCouponNameDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            coupon={coupon}
          />
          <DeleteLibraryCouponDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            coupon={coupon}
          />
        </>
      )
    },
  },
]
