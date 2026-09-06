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
import { useRevokeAccessGate } from '@virtality/react-query'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { formatRevokeAccessGateSuccessMessage } from '@/lib/access-gate-actions'
import { formatMutationErrorMessage } from '@/lib/admin-customer-actions'

type CustomerProfileRevokeAccessGateDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileRevokeAccessGateDialog({
  userId,
  open,
  onOpenChange,
}: CustomerProfileRevokeAccessGateDialogProps) {
  const { mutate, isPending } = useRevokeAccessGate()
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
          toast.success(formatRevokeAccessGateSuccessMessage(result))
          setReason('')
          setConfirmed(false)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            formatMutationErrorMessage(error, 'Failed to revoke Access Gate'),
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
            <DialogTitle>Revoke Access Gate</DialogTitle>
            <DialogDescription>
              Closes the customer&apos;s open Access Gate. This action is
              terminal for that row.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='revoke-access-gate-reason'>Reason</Label>
              <Input
                id='revoke-access-gate-reason'
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
                I confirm this customer&apos;s open Access Gate should be
                revoked.
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
              {isPending ? 'Revoking...' : 'Revoke gate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
