'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@virtality/ui/components/button'
import { SleepModePath } from './sleep-mode-path'

export function DownloadPrepDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Before you download</DialogTitle>
          <DialogDescription>
            Downloads take a while and stop when the headset goes to sleep. Set
            up the headset first so the download can finish.
          </DialogDescription>
        </DialogHeader>
        <ol className='list-decimal space-y-3 pl-5 text-sm'>
          <li>
            <p className='font-medium'>Keep the headset charging</p>
            <p className='text-muted-foreground'>
              Plug the headset in and leave it connected until the download
              finishes.
            </p>
          </li>
          <li>
            <p className='font-medium'>Set sleep mode to 4 hours</p>
            <SleepModePath />
          </li>
        </ol>
        <DialogFooter>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button variant='primary' onClick={onConfirm}>
            Start download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
