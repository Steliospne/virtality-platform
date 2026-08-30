'use client'

import type { CSSProperties } from 'react'
import type { CheckoutSuccessIntent } from '@virtality/shared/utils'
import { checkoutSuccessPalette } from '@/components/checkout-success/checkout-success-palette'

/**
 * Full-viewport atmosphere behind the celebration: soft radial washes tinted
 * by Checkout Success Intent.
 */
export function CheckoutSuccessAtmosphere({
  intent,
}: {
  intent: CheckoutSuccessIntent
}) {
  const palette = checkoutSuccessPalette(intent)
  const style = {
    '--cs-core': palette.core,
    '--cs-glow': palette.glow,
  } as CSSProperties

  return (
    <div
      aria-hidden
      className='pointer-events-none absolute inset-0 -z-10'
      style={style}
    >
      <div className='bg-background absolute inset-0' />
      <div
        className='absolute inset-0'
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 38%, color-mix(in oklab, var(--cs-glow) 24%, transparent), transparent 70%),
            radial-gradient(ellipse 50% 40% at 50% 72%, color-mix(in oklab, var(--cs-core) 16%, transparent), transparent 75%)
          `,
        }}
      />
    </div>
  )
}
