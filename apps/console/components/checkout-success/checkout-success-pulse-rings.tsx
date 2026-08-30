'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, MeshBasicMaterial } from 'three'
import type { CheckoutSuccessPalette } from './checkout-success-palette'

const RING_COUNT = 3
const CYCLE_SECONDS = 2.6
// Ring major radius and peak scale are kept inside the fixed mount
// camera's frustum (fov 45, distance 4.5 => a visible half-extent around
// 1.85 at the origin plane); rings are near-faded by the time they'd cross it.
const RING_RADIUS = 1.1
const PEAK_SCALE = 2.0

/**
 * Shockwave rings that continuously expand outward from the crystal core
 * and fade, staggered so a new pulse releases before the last one fully
 * fades. Reads as the celebration's heartbeat.
 */
export function CheckoutSuccessPulseRings({
  palette,
}: {
  palette: CheckoutSuccessPalette
}) {
  const meshes = useRef<Mesh[]>([])
  const offsets = useMemo(
    () =>
      Array.from(
        { length: RING_COUNT },
        (_, index) => (index / RING_COUNT) * CYCLE_SECONDS,
      ),
    [],
  )

  useFrame((state) => {
    offsets.forEach((offset, index) => {
      const mesh = meshes.current[index]
      if (!mesh) return
      const progress =
        ((state.clock.elapsedTime + offset) % CYCLE_SECONDS) / CYCLE_SECONDS
      mesh.scale.setScalar(0.7 + progress * (PEAK_SCALE - 0.7))
      const material = mesh.material as MeshBasicMaterial
      material.opacity = (1 - progress) * 0.5
    })
  })

  return (
    <>
      {offsets.map((offset, index) => (
        <mesh
          key={offset}
          ref={(mesh) => {
            if (mesh) meshes.current[index] = mesh
          }}
          rotation={[Math.PI / 2.4, 0, 0]}
        >
          <torusGeometry args={[RING_RADIUS, 0.015, 8, 64]} />
          <meshBasicMaterial
            color={palette.glow}
            transparent
            opacity={0.4}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  )
}
