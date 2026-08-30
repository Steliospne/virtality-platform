'use client'

import dynamic from 'next/dynamic'
import type { CheckoutSuccessIntent } from '@virtality/shared/utils'

const CheckoutSuccessCelebrationCanvas = dynamic(
  () =>
    import('./checkout-success-celebration-canvas').then(
      (module) => module.CheckoutSuccessCelebrationCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className='bg-muted/40 flex h-full min-h-48 w-full items-center justify-center rounded-xl'>
        <span className='text-muted-foreground text-sm'>
          Loading celebration…
        </span>
      </div>
    ),
  },
)

export function CheckoutSuccessCelebrationLazy({
  intent,
}: {
  intent: CheckoutSuccessIntent
}) {
  return (
    <div className='h-56 w-full overflow-hidden rounded-xl md:h-72'>
      <CheckoutSuccessCelebrationCanvas intent={intent} />
    </div>
  )
}
