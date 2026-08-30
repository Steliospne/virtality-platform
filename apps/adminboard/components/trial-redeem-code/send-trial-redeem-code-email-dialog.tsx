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
import { getErrorMessage } from '@/lib/get-error-message'
import { useSendTrialRedeemCodeEmail } from '@virtality/react-query'
import type { TrialRedeemCodeListItem } from '@virtality/shared/utils'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

type SendTrialRedeemCodeEmailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trialRedeemCode: TrialRedeemCodeListItem
}

export function SendTrialRedeemCodeEmailDialog({
  open,
  onOpenChange,
  trialRedeemCode,
}: SendTrialRedeemCodeEmailDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState('')
  const { mutate: sendEmail, isPending } = useSendTrialRedeemCodeEmail()

  useEffect(() => {
    if (!open) {
      setRecipientEmail('')
    }
  }, [open])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const trimmed = recipientEmail.trim()
    if (!trimmed.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    sendEmail(
      {
        id: trialRedeemCode.id,
        recipientEmail: trimmed,
      },
      {
        onSuccess: () => {
          toast.success(`Email sent to ${trimmed}`)
          onOpenChange(false)
        },
        onError: (error: unknown) => {
          toast.error(
            getErrorMessage(error, 'Failed to send Access Code email'),
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
            <DialogTitle>Send Access Code Email</DialogTitle>
            <DialogDescription>
              Delivery-only System Email for{' '}
              <span className='font-mono'>{trialRedeemCode.code}</span>. The
              recipient is not bound to the code; re-send while unused and
              inside the one-week TTL.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='trial-redeem-recipient-email'>
                Recipient email
              </Label>
              <Input
                id='trial-redeem-recipient-email'
                type='email'
                autoComplete='email'
                placeholder='clinician@clinic.example'
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' variant='primary' disabled={isPending}>
              {isPending ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
