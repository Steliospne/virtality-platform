'use client'

import type { CheckoutSuccessIntent } from '@virtality/shared/utils'
import { CheckoutSuccessCameraDrift } from './checkout-success-camera-drift'
import { CheckoutSuccessCrystal } from './checkout-success-crystal'
import { checkoutSuccessPalette } from './checkout-success-palette'
import { CheckoutSuccessParticleHalo } from './checkout-success-particle-halo'
import { CheckoutSuccessPulseRings } from './checkout-success-pulse-rings'

/**
 * Celebration canvas mount for the Checkout Success Page. Composes the
 * impressing Console-native scene: a faceted crystal core that breathes and
 * spins, shockwave rings pulsing outward, and an orbiting particle halo,
 * all tinted per Checkout Success Intent. Always runs, no reduced-motion
 * fallback (product locked).
 */
export function CheckoutSuccessCelebration({
  intent,
}: {
  intent: CheckoutSuccessIntent
}) {
  const palette = checkoutSuccessPalette(intent)

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 8]} intensity={1.1} />
      <pointLight
        position={[-3, -1.5, 3]}
        intensity={0.7}
        color={palette.glow}
      />
      <CheckoutSuccessCameraDrift />
      <CheckoutSuccessCrystal palette={palette} />
      <CheckoutSuccessPulseRings palette={palette} />
      <CheckoutSuccessParticleHalo palette={palette} />
    </>
  )
}
