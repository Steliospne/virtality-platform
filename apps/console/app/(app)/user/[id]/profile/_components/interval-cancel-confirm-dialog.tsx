'use client'

/**
 * Confirm releasing a scheduled paid Pro interval switch.
 */

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

type IntervalCancelConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body: string
  confirmLabel: string
  confirming?: boolean
  onConfirm: () => void
}

export function IntervalCancelConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  confirming = false,
  onConfirm,
}: IntervalCancelConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!confirming}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='outline' disabled={confirming}>
              Keep scheduled change
            </Button>
          </DialogClose>
          <Button
            type='button'
            variant='destructive'
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? 'Canceling…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
