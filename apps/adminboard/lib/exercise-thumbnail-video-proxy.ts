import { CDN_URL } from '@virtality/shared/types'

export const EXERCISE_THUMBNAIL_VIDEO_PROXY_PATH = '/api/video-proxy'

const ALLOWED_HOST = new URL(CDN_URL).hostname

/**
 * The CDN caches responses without keying on `Origin`, so CORS headers on a
 * cached object are unreliable. Canvas frame capture therefore reads CDN
 * videos through this same-origin proxy instead of `crossOrigin`.
 */
export function exerciseThumbnailVideoProxyUrl(cdnUrl: string): string {
  return `${EXERCISE_THUMBNAIL_VIDEO_PROXY_PATH}?url=${encodeURIComponent(cdnUrl)}`
}

export type VideoProxyTargetResult =
  | { ok: true; target: URL }
  | { ok: false; status: 400 | 403; message: string }

export function resolveVideoProxyTarget(
  rawUrl: string | null,
): VideoProxyTargetResult {
  if (!rawUrl) {
    return { ok: false, status: 400, message: 'Missing url query parameter.' }
  }

  let target: URL
  try {
    target = new URL(rawUrl)
  } catch {
    return { ok: false, status: 400, message: 'Invalid url query parameter.' }
  }

  if (target.protocol !== 'https:') {
    return {
      ok: false,
      status: 400,
      message: 'Only HTTPS video URLs are supported.',
    }
  }

  if (target.hostname !== ALLOWED_HOST) {
    return { ok: false, status: 403, message: 'Video host is not allowed.' }
  }

  return { ok: true, target }
}
