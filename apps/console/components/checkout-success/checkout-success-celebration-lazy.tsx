'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { CheckoutSuccessIntent } from '@virtality/shared/utils'
import { CheckoutSuccessCelebrationLoading } from './checkout-success-celebration-loading'

const CheckoutSuccessCelebrationCanvas = dynamic(
  () =>
    import('./checkout-success-celebration-canvas').then(
      (module) => module.CheckoutSuccessCelebrationCanvas,
    ),
  { ssr: false },
)

export function CheckoutSuccessCelebrationLazy({
  intent,
}: {
  intent: CheckoutSuccessIntent
}) {
  const [canvasReady, setCanvasReady] = useState(false)

  return (
    <div className='relative h-full w-full'>
      {!canvasReady ? (
        <CheckoutSuccessCelebrationLoading intent={intent} />
      ) : null}
      <div
        className={
          canvasReady
            ? 'h-full w-full'
            : 'pointer-events-none absolute inset-0 opacity-0'
        }
      >
        <CheckoutSuccessCelebrationCanvas
          intent={intent}
          onReady={() => setCanvasReady(true)}
        />
      </div>
    </div>
  )
}
