'use client'

import { Button } from '@virtality/ui/components/button'
import {
  PAID_CANCELLATION_UNDO_LABEL,
  PAID_INTERVAL_CANCEL_LABEL,
  PAID_INTERVAL_UPDATE_LABEL,
} from '@/lib/profile-billing'

export function BillingPlanCardCheckoutButton({
  label,
  pending,
  onCheckout,
}: {
  label: string
  pending: boolean
  onCheckout: () => void
}) {
  const isIntervalUpdate = label === PAID_INTERVAL_UPDATE_LABEL
  const isIntervalCancel = label === PAID_INTERVAL_CANCEL_LABEL
  const isCancellationUndo = label === PAID_CANCELLATION_UNDO_LABEL

  const pendingLabel = isCancellationUndo
    ? 'Restoring…'
    : isIntervalCancel
      ? 'Canceling…'
      : isIntervalUpdate
        ? 'Updating…'
        : 'Starting Checkout…'

  return (
    <Button
      type='button'
      variant={isIntervalCancel ? 'outline' : 'primary'}
      className='w-full'
      size='lg'
      disabled={pending}
      onClick={(event) => {
        event.stopPropagation()
        onCheckout()
      }}
    >
      {pending ? pendingLabel : label}
    </Button>
  )
}
