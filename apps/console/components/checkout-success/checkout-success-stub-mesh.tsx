'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { CheckoutSuccessIntent } from '@virtality/shared/utils'
import type { Mesh } from 'three'

export function CheckoutSuccessStubMesh({
  intent,
}: {
  intent: CheckoutSuccessIntent
}) {
  const meshRef = useRef<Mesh>(null)
  const color = intent === 'renew' ? '#38bdf8' : '#a78bfa'

  useFrame((_state, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x += delta * 0.45
    meshRef.current.rotation.y += delta * 0.65
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.2, 1]} />
      <meshStandardMaterial color={color} metalness={0.35} roughness={0.25} />
    </mesh>
  )
}
