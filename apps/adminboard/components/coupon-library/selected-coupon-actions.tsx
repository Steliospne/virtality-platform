'use client'

import { DeleteLibraryCouponDialog } from '@/components/coupon-library/delete-library-coupon-dialog'
import { EditLibraryCouponNameDialog } from '@/components/coupon-library/edit-library-coupon-name-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDropdownMenu } from '@/hooks/use-dropdown-menu-action'
import { getErrorMessage } from '@/lib/get-error-message'
import { useArchiveLibraryCoupon } from '@virtality/react-query'
import type { CouponLibraryRecord } from '@virtality/shared/utils'
import { Archive, Ellipsis, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function SelectedCouponActions({
  coupon,
}: {
  coupon: CouponLibraryRecord
}) {
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
          <Button type='button' size='sm' variant='outline'>
            <Ellipsis className='size-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
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
}
