'use client'

import { Canvas } from '@react-three/fiber'
import type { CheckoutSuccessIntent } from '@virtality/shared/utils'
import { CheckoutSuccessCelebration } from './checkout-success-celebration'

export function CheckoutSuccessCelebrationCanvas({
  intent,
}: {
  intent: CheckoutSuccessIntent
}) {
  return (
    <Canvas
      className='h-full w-full'
      camera={{ position: [0, 0, 4.5], fov: 45 }}
    >
      <CheckoutSuccessCelebration intent={intent} />
    </Canvas>
  )
}
