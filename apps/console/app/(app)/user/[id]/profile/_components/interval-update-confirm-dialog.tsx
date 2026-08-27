'use client'

/**
 * Confirm scheduling a paid Pro monthly ↔ yearly switch at period end.
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

type IntervalUpdateConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body: string
  confirmLabel: string
  confirming?: boolean
  onConfirm: () => void
}

export function IntervalUpdateConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  confirming = false,
  onConfirm,
}: IntervalUpdateConfirmDialogProps) {
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
              Keep current plan
            </Button>
          </DialogClose>
          <Button
            type='button'
            variant='primary'
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? 'Updating…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
