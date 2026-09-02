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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { useIssueTrialGrant } from '@virtality/react-query'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { formatMutationErrorMessage } from '@/lib/admin-customer-actions'
import { formatIssueTrialGrantSuccessMessage } from '@/lib/trial-grant-actions'

type CustomerProfileIssueTrialGrantDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileIssueTrialGrantDialog({
  userId,
  open,
  onOpenChange,
}: CustomerProfileIssueTrialGrantDialogProps) {
  const { mutate, isPending } = useIssueTrialGrant()
  const [reason, setReason] = useState('')
  const [code, setCode] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const canSubmit =
    reason.trim().length >= 3 &&
    code.trim().length > 0 &&
    confirmed &&
    !isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    mutate(
      {
        userId,
        reason: reason.trim(),
        code: code.trim(),
      },
      {
        onSuccess: (result) => {
          toast.success(formatIssueTrialGrantSuccessMessage(result))
          setReason('')
          setCode('')
          setConfirmed(false)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            formatMutationErrorMessage(error, 'Failed to issue trial grant'),
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
            <DialogTitle>Issue trial grant</DialogTitle>
            <DialogDescription>
              Creates a pending TrialGrant for a free-product code customer. The
              trial clock starts later when onboarding completes.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='issue-trial-grant-code'>Free-product code</Label>
              <Input
                id='issue-trial-grant-code'
                className='mt-1'
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder='PILOT-42'
              />
            </div>
            <div>
              <Label htmlFor='issue-trial-grant-reason'>Reason</Label>
              <Input
                id='issue-trial-grant-reason'
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
                I confirm this customer should receive a pending trial grant for
                the entered code.
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
              {isPending ? 'Issuing...' : 'Issue grant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
