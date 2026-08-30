'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { CheckoutSuccessPalette } from './checkout-success-palette'
import { useCheckoutSuccessTimer } from './checkout-success-timer'

const PARTICLE_COUNT = 220
// Kept inside the fixed mount camera's frustum (fov 45, distance 4.5 => a
// visible half-extent around 1.85 at the origin plane).
const BASE_RADIUS = 1.5

function buildHaloPositions() {
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const angle = (index / PARTICLE_COUNT) * Math.PI * 2
    const radius =
      BASE_RADIUS + Math.sin(angle * 3) * 0.12 + Math.random() * 0.15
    const height = (Math.random() - 0.5) * 0.4
    positions[index * 3] = Math.cos(angle) * radius
    positions[index * 3 + 1] = height
    positions[index * 3 + 2] = Math.sin(angle) * radius
  }
  return positions
}

/**
 * Orbiting particle halo that drifts around the crystal core, tilted off
 * axis for depth. Direction mirrors the crystal's spin per intent.
 */
export function CheckoutSuccessParticleHalo({
  palette,
}: {
  palette: CheckoutSuccessPalette
}) {
  const groupRef = useRef<Group>(null)
  const timer = useCheckoutSuccessTimer()
  const positions = useMemo(() => buildHaloPositions(), [])

  useFrame((_state, delta) => {
    const group = groupRef.current
    if (!group) return
    group.rotation.y += delta * 0.22 * palette.spin
    group.rotation.x = 0.28 + Math.sin(timer.getElapsed() * 0.3) * 0.1
  })

  return (
    <group ref={groupRef} rotation={[0.28, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach='attributes-position' args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={palette.halo}
          size={0.05}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
