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

type ExerciseWizardCancelDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmLeave: () => void
}

export function ExerciseWizardCancelDialog({
  open,
  onOpenChange,
  onConfirmLeave,
}: ExerciseWizardCancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave the wizard?</DialogTitle>
          <DialogDescription>
            Your Exercise Draft stays on the exercises page so you or another
            admin can resume it later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Keep editing
          </Button>
          <Button type='button' onClick={onConfirmLeave}>
            Leave wizard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
