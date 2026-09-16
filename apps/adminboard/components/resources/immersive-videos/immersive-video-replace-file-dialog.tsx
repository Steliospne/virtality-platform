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
import { ImmersiveVideoFilePicker } from '@/components/resources/immersive-videos/immersive-video-file-picker'
import type { ImmersiveVideoPickedFile } from '@/components/resources/immersive-videos/immersive-video-file-picker'

export function ImmersiveVideoReplaceFileDialog({
  open,
  onOpenChange,
  disabled,
  disabledReason,
  onFile,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
  disabledReason?: string
  onFile: (picked: ImmersiveVideoPickedFile) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace file</DialogTitle>
          <DialogDescription>
            The new file replaces the current one once the upload finishes.
            Headsets that already downloaded this video keep the copy they have
            until the VR app refreshes its catalog.
          </DialogDescription>
        </DialogHeader>
        {disabled ? (
          <p className='text-sm'>{disabledReason}</p>
        ) : (
          <ImmersiveVideoFilePicker
            onPicked={(picked) => {
              onFile(picked)
              onOpenChange(false)
            }}
          />
        )}
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
