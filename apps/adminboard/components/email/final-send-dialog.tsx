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

type FinalSendDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: string
  recipientCount: number
  confirmedSubject: string
  onConfirmedSubjectChange: (value: string) => void
  onConfirm: () => void
  isPending: boolean
}

export const FinalSendDialog = ({
  open,
  onOpenChange,
  subject,
  recipientCount,
  confirmedSubject,
  onConfirmedSubjectChange,
  onConfirm,
  isPending,
}: FinalSendDialogProps) => {
  const subjectMatches = confirmedSubject === subject
  const canConfirm = subjectMatches && recipientCount > 0 && !isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm final send</DialogTitle>
          <DialogDescription>
            Final send is immediate and irreversible. Confirm the subject and
            recipient count before sending.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='rounded-lg border p-4 text-sm'>
            <p>
              <span className='text-muted-foreground'>Recipients:</span>{' '}
              <span className='font-medium'>{recipientCount}</span>
            </p>
            <p className='mt-2'>
              <span className='text-muted-foreground'>Subject:</span>{' '}
              <span className='font-medium'>{subject || '(empty)'}</span>
            </p>
          </div>

          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Re-type the subject to confirm
            </label>
            <Input
              className='mt-1'
              value={confirmedSubject}
              onChange={(event) => onConfirmedSubjectChange(event.target.value)}
              placeholder={subject}
            />
            {!subjectMatches && confirmedSubject.length > 0 ? (
              <p className='mt-1 text-sm text-red-600'>
                Subject must match exactly.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!canConfirm}>
            {isPending ? 'Sending...' : 'Send now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
