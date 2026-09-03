'use client'

/**
 * Confirm scheduling a paid Default monthly ↔ yearly switch at period end.
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

type IntervalUpgradeConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body: string
  confirmLabel: string
  confirming?: boolean
  onConfirm: () => void
}

export function IntervalUpgradeConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  confirming = false,
  onConfirm,
}: IntervalUpgradeConfirmDialogProps) {
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
            {confirming ? 'Upgrading…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
