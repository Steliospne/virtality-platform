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
import { useRevokeTrialGrant } from '@virtality/react-query'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { formatMutationErrorMessage } from '@/lib/admin-customer-actions'
import { formatRevokeTrialGrantSuccessMessage } from '@/lib/trial-grant-actions'

type CustomerProfileRevokeTrialGrantDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileRevokeTrialGrantDialog({
  userId,
  open,
  onOpenChange,
}: CustomerProfileRevokeTrialGrantDialogProps) {
  const { mutate, isPending } = useRevokeTrialGrant()
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
          toast.success(formatRevokeTrialGrantSuccessMessage(result))
          setReason('')
          setConfirmed(false)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            formatMutationErrorMessage(error, 'Failed to revoke trial grant'),
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
            <DialogTitle>Revoke trial grant</DialogTitle>
            <DialogDescription>
              Ends the pending or active owned trial immediately. The customer
              keeps history, but entitlement from this grant stops.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='revoke-trial-grant-reason'>Reason</Label>
              <Input
                id='revoke-trial-grant-reason'
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
                I confirm this trial grant should be revoked before conversion.
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
            <Button type='submit' variant='destructive' disabled={!canSubmit}>
              {isPending ? 'Revoking...' : 'Revoke grant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
