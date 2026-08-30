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
import { Textarea } from '@virtality/ui/components/textarea'
import {
  DEFAULT_TRIAL_REDEEM_DAYS,
  TRIAL_REDEEM_CODE_MODES,
  TRIAL_REDEEM_CODE_MODE_LABELS,
  type CreateTrialRedeemCodeInput,
  type TrialRedeemCodeMode,
} from '@virtality/shared/utils'
import { useCreateTrialRedeemCode } from '@virtality/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

type CreateTrialRedeemCodeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTrialRedeemCodeDialog({
  open,
  onOpenChange,
}: CreateTrialRedeemCodeDialogProps) {
  const [mode, setMode] = useState<TrialRedeemCodeMode>('timed_trial')
  const [trialDays, setTrialDays] = useState('')
  const [note, setNote] = useState('')
  const { mutate: createTrialRedeemCode, isPending } =
    useCreateTrialRedeemCode()

  useEffect(() => {
    if (!open) {
      setMode('timed_trial')
      setTrialDays('')
      setNote('')
    }
  }, [open])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const payload: CreateTrialRedeemCodeInput = { mode }

    if (mode === 'timed_trial') {
      const trimmedDays = trialDays.trim()
      if (trimmedDays !== '') {
        const parsedDays = Number(trimmedDays)
        if (!Number.isInteger(parsedDays) || parsedDays < 1) {
          toast.error('Trial days must be a positive whole number')
          return
        }
        payload.trialDays = parsedDays
      }
    }

    const trimmedNote = note.trim()
    if (trimmedNote !== '') {
      payload.note = trimmedNote
    }

    createTrialRedeemCode(payload, {
      onSuccess: (created) => {
        toast.success(`Created ${created.code}`)
        onOpenChange(false)
      },
      onError: () => {
        toast.error('Failed to create Access Code')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Access Code</DialogTitle>
            <DialogDescription>
              Generates a one-time `GO-` bearer code. Choose Free for permanent
              Free access or Trial for a no-card Free trial (default{' '}
              {DEFAULT_TRIAL_REDEEM_DAYS} days).
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='access-code-mode'>Mode</Label>
              <Select
                value={mode}
                onValueChange={(value) => setMode(value as TrialRedeemCodeMode)}
              >
                <SelectTrigger id='access-code-mode'>
                  <SelectValue placeholder='Select mode' />
                </SelectTrigger>
                <SelectContent>
                  {TRIAL_REDEEM_CODE_MODES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {TRIAL_REDEEM_CODE_MODE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {mode === 'timed_trial' ? (
              <div className='grid gap-2'>
                <Label htmlFor='trial-days'>Trial days (optional)</Label>
                <Input
                  id='trial-days'
                  type='number'
                  min={1}
                  step={1}
                  placeholder={String(DEFAULT_TRIAL_REDEEM_DAYS)}
                  value={trialDays}
                  onChange={(event) => setTrialDays(event.target.value)}
                />
              </div>
            ) : null}
            <div className='grid gap-2'>
              <Label htmlFor='trial-note'>Note (optional)</Label>
              <Textarea
                id='trial-note'
                placeholder='Why this code was issued'
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
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
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
