'use client'

import type { CSSProperties } from 'react'
import type { CheckoutSuccessIntent } from '@virtality/shared/utils'
import { checkoutSuccessPalette } from './checkout-success-palette'
import styles from './checkout-success-celebration-loading.module.css'

/**
 * SSR-safe stand-in for the R3F celebration while the canvas chunk loads:
 * a breathing crystal facet with expanding pulse rings, tinted per intent.
 */
export function CheckoutSuccessCelebrationLoading({
  intent,
}: {
  intent: CheckoutSuccessIntent
}) {
  const palette = checkoutSuccessPalette(intent)
  const stageStyle = {
    '--cs-core': palette.core,
    '--cs-glow': palette.glow,
    '--cs-halo': palette.halo,
    '--cs-spin-direction': palette.spin === 1 ? 'normal' : 'reverse',
  } as CSSProperties

  return (
    <div className={styles.stage} style={stageStyle} aria-hidden>
      <div className={styles.glow} />
      <div className={`${styles.ring} ${styles.ringA}`} />
      <div className={`${styles.ring} ${styles.ringB}`} />
      <div className={`${styles.ring} ${styles.ringC}`} />
      <div className={styles.crystal} />
    </div>
  )
}
