'use client'

import { Canvas } from '@react-three/fiber'
import type { CheckoutSuccessIntent } from '@virtality/shared/utils'
import { CheckoutSuccessCelebration } from './checkout-success-celebration'

const CLOCK_DEPRECATION_SNIPPET =
  'Clock: This module has been deprecated. Please use THREE.Timer instead.'

type GatedWarn = typeof console.warn & {
  __checkoutSuccessClockGate?: boolean
}

/**
 * R3F 9 constructs THREE.Clock once per Canvas (pmndrs/react-three-fiber#3741).
 * This module only loads on the client (dynamic ssr:false), so the gate is in
 * place before Canvas mounts. Our scene uses THREE.Timer; drop this when
 * upgrading to R3F v10.
 */
function installClockDeprecationGate() {
  if (typeof window === 'undefined') return
  const current = console.warn as GatedWarn
  if (current.__checkoutSuccessClockGate) return

  const originalWarn = console.warn
  const gated: GatedWarn = (...args: unknown[]) => {
    const first = args[0]
    if (
      typeof first === 'string' &&
      first.includes(CLOCK_DEPRECATION_SNIPPET)
    ) {
      return
    }
    originalWarn.apply(console, args as Parameters<typeof console.warn>)
  }
  gated.__checkoutSuccessClockGate = true
  console.warn = gated
}

installClockDeprecationGate()

export function CheckoutSuccessCelebrationCanvas({
  intent,
  onReady,
}: {
  intent: CheckoutSuccessIntent
  onReady?: () => void
}) {
  return (
    <Canvas
      className='h-full w-full bg-transparent'
      camera={{ position: [0, 0, 4.5], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={() => onReady?.()}
    >
      <CheckoutSuccessCelebration intent={intent} />
    </Canvas>
  )
}
