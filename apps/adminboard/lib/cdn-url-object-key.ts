import { CDN_URL } from '@virtality/shared/types'

export function objectKeyFromCdnUrl(cdnUrl: string): string | null {
  const prefix = `${CDN_URL}/`
  if (!cdnUrl.startsWith(prefix)) {
    return null
  }

  return cdnUrl.slice(prefix.length)
}
