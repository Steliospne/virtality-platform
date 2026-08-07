import { CDN_URL } from '../types/general.ts'

const CDN_URL_PREFIX = `${CDN_URL}/`

/**
 * True when `next/image` should set `unoptimized` so Vercel Image Optimization
 * is skipped. Virtality CDN assets are already on `cdn.virtality.app`; keep
 * resizing/compression there instead of paying for a second pass on Vercel.
 *
 * Website hero images stay on local `/public` paths and are not matched here.
 */
export function shouldBypassVercelImageOptimization(
  src: string | null | undefined,
): boolean {
  if (!src) {
    return false
  }

  return src === CDN_URL || src.startsWith(CDN_URL_PREFIX)
}
