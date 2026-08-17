'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { COUPON_LIBRARY_DELETE_COPY } from '@/lib/coupon-library-display'
import { getErrorMessage } from '@/lib/get-error-message'
import { useDeleteLibraryCoupon } from '@virtality/react-query'
import type { CouponLibraryRecord } from '@virtality/shared/utils'
import { toast } from 'sonner'

type DeleteLibraryCouponDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon: CouponLibraryRecord
}

export function DeleteLibraryCouponDialog({
  open,
  onOpenChange,
  coupon,
}: DeleteLibraryCouponDialogProps) {
  const { mutate: deleteLibraryCoupon, isPending } = useDeleteLibraryCoupon()

  const handleDelete = () => {
    deleteLibraryCoupon(
      { id: coupon.id },
      {
        onSuccess: () => {
          toast.success('Coupon deleted')
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, 'Failed to delete Coupon'))
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Coupon</DialogTitle>
          <DialogDescription>{COUPON_LIBRARY_DELETE_COPY}</DialogDescription>
        </DialogHeader>
        <p className='text-muted-foreground text-sm'>
          Delete{' '}
          <span className='text-foreground font-medium'>
            {coupon.name ?? coupon.id}
          </span>
          ?
        </p>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
