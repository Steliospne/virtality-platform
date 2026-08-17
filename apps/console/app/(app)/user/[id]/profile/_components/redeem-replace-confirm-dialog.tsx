/**
 * Confirm dialog when redeeming a Promotion Code over campaign/prior promo.
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
import { BILLING_DISCOUNT_TIMING_COPY } from '@/lib/profile-billing'

type RedeemReplaceConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
  currentLabel: string | null
  onConfirm: () => void
  confirming?: boolean
}

export function RedeemReplaceConfirmDialog({
  open,
  onOpenChange,
  code,
  currentLabel,
  onConfirm,
  confirming = false,
}: RedeemReplaceConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!confirming}>
        <DialogHeader>
          <DialogTitle>Replace current discount?</DialogTitle>
          <DialogDescription asChild>
            <div className='space-y-3 pt-1 text-sm text-zinc-500'>
              <p>
                Applying{' '}
                <span className='font-mono font-medium text-zinc-800 dark:text-zinc-200'>
                  {code}
                </span>{' '}
                will replace
                {currentLabel ? (
                  <>
                    {' '}
                    <span className='font-medium text-zinc-800 dark:text-zinc-200'>
                      {currentLabel}
                    </span>
                  </>
                ) : (
                  ' your current discount'
                )}
                .
              </p>
              <p>{BILLING_DISCOUNT_TIMING_COPY}</p>
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
            variant='primary'
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? 'Applying…' : 'Replace discount'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
