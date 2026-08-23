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
import { Label } from '@virtality/ui/components/label'
import { useAssignPermanentFree } from '@virtality/react-query'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { formatAssignPermanentFreeSuccessMessage } from '@/lib/admin-customer-actions'

type CustomerProfileAssignFreeDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  testerRecipient: boolean
}

export function CustomerProfileAssignFreeDialog({
  userId,
  open,
  onOpenChange,
  testerRecipient,
}: CustomerProfileAssignFreeDialogProps) {
  const { mutate, isPending } = useAssignPermanentFree()
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const canSubmit = reason.trim().length >= 3 && confirmed && !isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    mutate(
      { userId, reason: reason.trim() },
      {
        onSuccess: (result) => {
          toast.success(formatAssignPermanentFreeSuccessMessage(result))
          setReason('')
          setConfirmed(false)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to assign permanent Free',
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign permanent Free</DialogTitle>
            <DialogDescription>
              Creates a Stripe customer when needed and a zero-value Free
              subscription without a trial. VR program launch stays blocked.
              {testerRecipient
                ? ' This tester account will become a standard user.'
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='assign-free-reason'>Reason</Label>
              <Input
                id='assign-free-reason'
                className='mt-1'
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder='Support note for the audit trail'
              />
            </div>
            <label className='flex items-start gap-2 text-sm'>
              <input
                type='checkbox'
                className='mt-1'
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>
                I confirm this customer should receive permanent Free access
                without a trial period.
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {isPending ? 'Assigning...' : 'Assign Free'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
