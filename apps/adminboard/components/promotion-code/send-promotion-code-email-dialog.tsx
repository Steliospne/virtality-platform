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
import { useSendPromotionCodeEmail } from '@virtality/react-query'
import type { PromotionCodeRecord } from '@virtality/shared/utils'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

type SendPromotionCodeEmailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  promotionCode: PromotionCodeRecord
}

export function SendPromotionCodeEmailDialog({
  open,
  onOpenChange,
  promotionCode,
}: SendPromotionCodeEmailDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState('')
  const { mutate: sendEmail, isPending } = useSendPromotionCodeEmail()

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
        id: promotionCode.id,
        recipientEmail: trimmed,
      },
      {
        onSuccess: () => {
          toast.success(`Email sent to ${trimmed}`)
          onOpenChange(false)
        },
        onError: (error: unknown) => {
          toast.error(
            getErrorMessage(error, 'Failed to send Promotion Code email'),
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
            <DialogTitle>Send Promotion Code Email</DialogTitle>
            <DialogDescription>
              Delivery-only System Email for{' '}
              <span className='font-mono'>{promotionCode.code}</span>. The
              recipient is not bound to the code. Inactive codes cannot be
              emailed.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='promotion-code-recipient-email'>
                Recipient email
              </Label>
              <Input
                id='promotion-code-recipient-email'
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
            <Button
              type='submit'
              variant='primary'
              disabled={isPending || !promotionCode.active}
            >
              {isPending ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
