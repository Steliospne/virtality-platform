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
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { getErrorMessage } from '@/lib/get-error-message'
import { useUpdateLibraryCouponName } from '@virtality/react-query'
import type { CouponLibraryRecord } from '@virtality/shared/utils'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

type EditLibraryCouponNameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon: CouponLibraryRecord
}

export function EditLibraryCouponNameDialog({
  open,
  onOpenChange,
  coupon,
}: EditLibraryCouponNameDialogProps) {
  const [name, setName] = useState(coupon.name ?? '')
  const { mutate: updateName, isPending } = useUpdateLibraryCouponName()

  useEffect(() => {
    if (open) {
      setName(coupon.name ?? '')
    }
  }, [open, coupon.name])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    updateName(
      { id: coupon.id, name: name.trim() },
      {
        onSuccess: () => {
          toast.success('Coupon name updated')
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, 'Failed to update Coupon name'))
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Coupon name</DialogTitle>
            <DialogDescription>
              Only the name can change after create. Discount and duration stay
              fixed.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-coupon-name'>Name</Label>
              <Input
                id='edit-coupon-name'
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' variant='primary' disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
