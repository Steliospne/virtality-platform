'use client'

import { useFrame } from '@react-three/fiber'
import { useCheckoutSuccessTimer } from './checkout-success-timer'

/**
 * Slow, continuous camera drift so the celebration reads as living rather
 * than a static render. No user interaction required.
 */
export function CheckoutSuccessCameraDrift() {
  const timer = useCheckoutSuccessTimer()

  useFrame((state) => {
    const elapsed = timer.getElapsed()
    const { camera } = state
    camera.position.x = Math.sin(elapsed * 0.25) * 0.4
    camera.position.y = Math.cos(elapsed * 0.2) * 0.25
    camera.lookAt(0, 0, 0)
  })

  return null
}
