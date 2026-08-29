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
import {
  useAssignableProVariants,
  useAssignProVariant,
} from '@virtality/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { formatMutationErrorMessage } from '@/lib/admin-customer-actions'

type CustomerProfileAssignVariantDialogProps = {
  userId: string
  currentVariant: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileAssignVariantDialog({
  userId,
  currentVariant,
  open,
  onOpenChange,
}: CustomerProfileAssignVariantDialogProps) {
  const { mutate, isPending } = useAssignProVariant()
  const variantsQuery = useAssignableProVariants(open)
  const [variantName, setVariantName] = useState(currentVariant)
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!open) return
    setVariantName(currentVariant)
    setReason('')
    setConfirmed(false)
  }, [open, currentVariant])

  const variants = variantsQuery.data?.variants ?? []
  const canSubmit =
    variantName.trim().length > 0 &&
    reason.trim().length >= 3 &&
    confirmed &&
    !isPending &&
    !variantsQuery.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    mutate(
      {
        userId,
        reason: reason.trim(),
        variantName: variantName.trim(),
      },
      {
        onSuccess: (result) => {
          toast.success(
            `Assigned Pro variant set to ${result.assignedProVariant}.`,
          )
          setReason('')
          setConfirmed(false)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            formatMutationErrorMessage(error, 'Failed to assign Pro variant'),
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
            <DialogTitle>Assign Pro variant</DialogTitle>
            <DialogDescription>
              Pick the Price pair this clinician should charge on Checkout and
              cycle plan changes. Requires a reason and confirmation.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div>
              <Label>Variant</Label>
              <Select
                value={variantName}
                onValueChange={setVariantName}
                disabled={variantsQuery.isPending}
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue placeholder='Select a variant' />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((variant) => (
                    <SelectItem key={variant.name} value={variant.name}>
                      <span className='flex flex-col items-start gap-0.5'>
                        <span>{variant.label}</span>
                        <span className='text-muted-foreground text-xs'>
                          {variant.secondaryLabel}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {variantsQuery.isError ? (
                <p className='text-destructive mt-2 text-sm'>
                  Failed to load assignable variants.
                </p>
              ) : null}
              {variantsQuery.data && !variantsQuery.data.basicPresent ? (
                <p className='text-muted-foreground mt-2 text-sm'>
                  Catalog is missing the basic pair. Sandbox or Stripe catalog
                  may be incomplete.
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor='assign-pro-variant-reason'>Reason</Label>
              <Input
                id='assign-pro-variant-reason'
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
                I confirm this Assigned Variant should apply to future Pro
                charges for this customer.
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
              {isPending ? 'Assigning...' : 'Assign variant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
