'use client'

import type { CheckoutSuccessIntent } from '@virtality/shared/utils'
import { CheckoutSuccessStubMesh } from './checkout-success-stub-mesh'

/**
 * Celebration canvas mount for the Checkout Success Page. The companion
 * authoring ticket replaces this stub scene and copy.
 */
export function CheckoutSuccessCelebration({
  intent,
}: {
  intent: CheckoutSuccessIntent
}) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 8]} intensity={1.1} />
      <CheckoutSuccessStubMesh intent={intent} />
    </>
  )
}
