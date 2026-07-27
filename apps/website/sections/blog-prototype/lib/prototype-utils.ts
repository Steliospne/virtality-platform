import type { BlogPrototypeVariantKey } from '../types'
import { BLOG_PROTOTYPE_VARIANTS } from '../types'

export function parseBlogPrototypeVariant(
  value: string | string[] | undefined,
): BlogPrototypeVariantKey {
  const raw = Array.isArray(value) ? value[0] : value
  const match = BLOG_PROTOTYPE_VARIANTS.find((variant) => variant.key === raw)
  return match?.key ?? 'A'
}

export function blogPrototypeHref(
  path: string,
  variant: BlogPrototypeVariantKey,
): string {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}variant=${variant}`
}

/** Display-only date for prototypes — content stores YYYY-MM-DD. */
export function formatPrototypeDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function youtubeEmbedUrl(watchUrl: string): string | null {
  try {
    const url = new URL(watchUrl)
    const id =
      url.searchParams.get('v') ??
      (url.hostname.includes('youtu.be')
        ? url.pathname.replace(/^\//, '')
        : null)
    if (!id) return null
    return `https://www.youtube.com/embed/${id}`
  } catch {
    return null
  }
}
