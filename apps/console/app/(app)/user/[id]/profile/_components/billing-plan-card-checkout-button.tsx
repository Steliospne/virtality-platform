'use client'

import { Button } from '@virtality/ui/components/button'
import type { ProfileBillingCardActiveAction } from '@/lib/profile-billing'

export function BillingPlanCardCheckoutButton({
  kind,
  label,
  pendingLabel,
  pending,
  onCheckout,
}: {
  kind: ProfileBillingCardActiveAction['kind']
  label: string
  pendingLabel: string
  pending: boolean
  onCheckout: () => void
}) {
  return (
    <Button
      type='button'
      variant={kind === 'cancel_schedule' ? 'outline' : 'primary'}
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
