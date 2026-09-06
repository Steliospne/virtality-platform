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
  const isActive = kind === 'active'

  return (
    <Button
      type='button'
      variant={kind === 'cancel_schedule' || isActive ? 'outline' : 'primary'}
      className='w-full'
      size='lg'
      disabled={pending || isActive}
      onClick={(event) => {
        event.stopPropagation()
        if (isActive) return
        onCheckout()
      }}
    >
      {pending ? pendingLabel : label}
    </Button>
  )
}
