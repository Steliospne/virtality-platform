import type { CheckoutSuccessIntent } from '@virtality/shared/utils'

export type CheckoutSuccessPalette = {
  /** Core crystal color. */
  core: string
  /** Emissive / accent glow color for the crystal, rings, and lighting. */
  glow: string
  /** Particle halo color. */
  halo: string
  /** Rotation direction, so Subscribe and Renew spin opposite ways. */
  spin: 1 | -1
}

const PALETTES: Record<CheckoutSuccessIntent, CheckoutSuccessPalette> = {
  subscribe: {
    core: '#39dff5',
    glow: '#a78bfa',
    halo: '#65e6f7',
    spin: 1,
  },
  renew: {
    core: '#f5b83c',
    glow: '#fb923c',
    halo: '#fcd34d',
    spin: -1,
  },
}

export function checkoutSuccessPalette(
  intent: CheckoutSuccessIntent,
): CheckoutSuccessPalette {
  return PALETTES[intent]
}
