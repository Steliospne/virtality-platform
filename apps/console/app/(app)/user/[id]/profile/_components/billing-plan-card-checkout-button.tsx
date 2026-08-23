'use client'

import { Button } from '@virtality/ui/components/button'

export function BillingPlanCardCheckoutButton({
  label,
  pending,
  onCheckout,
}: {
  label: string
  pending: boolean
  onCheckout: () => void
}) {
  return (
    <Button
      type='button'
      variant='primary'
      className='mt-4 w-full'
      size='lg'
      disabled={pending}
      onClick={(event) => {
        event.stopPropagation()
        onCheckout()
      }}
    >
      {pending ? 'Starting Checkout…' : label}
    </Button>
  )
}
