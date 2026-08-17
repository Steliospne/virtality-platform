/**
 * Confirm dialog for clinician self-remove of a promo Discount (#73).
 */

'use client'

import { Button } from '@virtality/ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BILLING_DISCOUNT_TIMING_COPY,
  PROMO_REMOVE_NO_RESTORE_COPY,
} from '@/lib/profile-billing'

type RemovePromoConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  promotionCode: string | null
  onConfirm: () => void
  confirming?: boolean
}

export function RemovePromoConfirmDialog({
  open,
  onOpenChange,
  promotionCode,
  onConfirm,
  confirming = false,
}: RemovePromoConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!confirming}>
        <DialogHeader>
          <DialogTitle>Remove Promotion Code?</DialogTitle>
          <DialogDescription asChild>
            <div className='space-y-3 pt-1 text-sm text-zinc-500'>
              {promotionCode ? (
                <p>
                  This removes Promotion Code{' '}
                  <span className='font-mono font-medium text-zinc-800 dark:text-zinc-200'>
                    {promotionCode}
                  </span>{' '}
                  from your subscription.
                </p>
              ) : (
                <p>
                  This removes the Promotion Code discount from your
                  subscription.
                </p>
              )}
              <p>
                Your next invoice will be at catalog list price.{' '}
                {BILLING_DISCOUNT_TIMING_COPY}
              </p>
              <p>{PROMO_REMOVE_NO_RESTORE_COPY}</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='outline' disabled={confirming}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type='button'
            variant='destructive'
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? 'Removing…' : 'Remove discount'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
