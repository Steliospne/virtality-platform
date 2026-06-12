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
import { ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY } from '@/lib/admin-email-draft-actions'

type AdminEmailDraftArchiveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
}

export const AdminEmailDraftArchiveDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: AdminEmailDraftArchiveDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY.title}</DialogTitle>
          <DialogDescription>
            {ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY.description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending
              ? 'Archiving...'
              : ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
