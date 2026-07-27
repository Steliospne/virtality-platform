/**
 * PROTOTYPE — Supported by logo colour treatment.
 *
 * Question: at full opacity, should partner logos be greyscale or keep
 * brand colours?
 *
 * Flip via `/?variant=A` or `/?variant=B` (dev only).
 */
export const SUPPORTED_BY_LOGO_STYLE_VARIANTS = [
  { key: 'A', name: 'Full opacity greyscale' },
  { key: 'B', name: 'Full opacity colour' },
] as const

export type SupportedByLogoStyleVariantKey =
  (typeof SUPPORTED_BY_LOGO_STYLE_VARIANTS)[number]['key']

export type SupportedByLogoTone = 'greyscale-full' | 'brand-full'

export function logoToneForVariant(
  variant: string | null | undefined,
): SupportedByLogoTone {
  if (variant === 'B') {
    return 'brand-full'
  }

  return 'greyscale-full'
}
