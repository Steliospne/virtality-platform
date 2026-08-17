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
import { useCreatePromotionCode } from '@virtality/react-query'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

type CreatePromotionCodeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  couponId: string
  couponName: string | null
  couponArchived: boolean
}

export function CreatePromotionCodeDialog({
  open,
  onOpenChange,
  couponId,
  couponName,
  couponArchived,
}: CreatePromotionCodeDialogProps) {
  const [code, setCode] = useState('')
  const [expiresAtLocal, setExpiresAtLocal] = useState('')
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const { mutate: createPromotionCode, isPending } = useCreatePromotionCode()

  useEffect(() => {
    if (open) return
    setCode('')
    setExpiresAtLocal('')
    setMaxRedemptions('')
  }, [open])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (couponArchived) {
      toast.error('Cannot create Promotion Codes on an archived Coupon')
      return
    }

    let expiresAt: number | undefined
    if (expiresAtLocal.trim()) {
      const parsed = Date.parse(expiresAtLocal)
      if (!Number.isFinite(parsed)) {
        toast.error('Enter a valid expiry date')
        return
      }
      expiresAt = Math.floor(parsed / 1000)
    }

    let maxRedemptionsValue: number | undefined
    if (maxRedemptions.trim()) {
      const parsed = Number(maxRedemptions)
      if (!Number.isInteger(parsed) || parsed < 1) {
        toast.error('Max redemptions must be a positive whole number')
        return
      }
      maxRedemptionsValue = parsed
    }

    createPromotionCode(
      {
        couponId,
        code: code.trim() ? code.trim() : null,
        expiresAt: expiresAt ?? null,
        maxRedemptions: maxRedemptionsValue ?? null,
      },
      {
        onSuccess: (result) => {
          toast.success(`Promotion Code ${result.code} created`)
          onOpenChange(false)
        },
        onError: (error) =>
          toast.error(
            getErrorMessage(error, 'Failed to create Promotion Code'),
          ),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Promotion Code</DialogTitle>
            <DialogDescription>
              Nested under Coupon {couponName ?? couponId}. Leave code blank for
              Stripe auto-generate. TE- and PAY- prefixes are rejected.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='promotion-code-code'>Code (optional)</Label>
              <Input
                id='promotion-code-code'
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder='SAVE20'
                autoComplete='off'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='promotion-code-expires'>
                Expires at (optional)
              </Label>
              <Input
                id='promotion-code-expires'
                type='datetime-local'
                value={expiresAtLocal}
                onChange={(event) => setExpiresAtLocal(event.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='promotion-code-max'>
                Max redemptions (optional)
              </Label>
              <Input
                id='promotion-code-max'
                type='number'
                min={1}
                step={1}
                value={maxRedemptions}
                onChange={(event) => setMaxRedemptions(event.target.value)}
                placeholder='Unlimited'
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
              disabled={isPending || couponArchived}
            >
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
