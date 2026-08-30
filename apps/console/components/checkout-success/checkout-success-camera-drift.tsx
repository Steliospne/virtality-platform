'use client'

import { useFrame } from '@react-three/fiber'

/**
 * Slow, continuous camera drift so the celebration reads as living rather
 * than a static render. No user interaction required.
 */
export function CheckoutSuccessCameraDrift() {
  useFrame((state) => {
    const { camera } = state
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.4
    camera.position.y = Math.cos(state.clock.elapsedTime * 0.2) * 0.25
    camera.lookAt(0, 0, 0)
  })

  return null
}
