'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import type { CheckoutSuccessPalette } from './checkout-success-palette'
import { useCheckoutSuccessTimer } from './checkout-success-timer'

/**
 * Faceted crystal core of the celebration: spins continuously and breathes
 * (subtle scale pulse) so the scene reads as alive even at rest.
 */
export function CheckoutSuccessCrystal({
  palette,
}: {
  palette: CheckoutSuccessPalette
}) {
  const meshRef = useRef<Mesh>(null)
  const timer = useCheckoutSuccessTimer()

  useFrame((_state, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.rotation.x += delta * 0.35 * palette.spin
    mesh.rotation.y += delta * 0.5 * palette.spin
    const breath = 1 + Math.sin(timer.getElapsed() * 1.6) * 0.06
    mesh.scale.setScalar(breath)
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.15, 1]} />
      <meshStandardMaterial
        color={palette.core}
        emissive={palette.glow}
        emissiveIntensity={0.55}
        metalness={0.4}
        roughness={0.15}
      />
    </mesh>
  )
}
