import { getUserAndSession } from '@/lib/actions/authActions'
import { resolveVideoProxyTarget } from '@/lib/exercise-thumbnail-video-proxy'
import { serverLogger } from '@/lib/server-logger'
import type { NextRequest } from 'next/server'

const logger = serverLogger.child({
  component: 'adminboard-api-video-proxy',
})

const PASSTHROUGH_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'etag',
  'last-modified',
] as const

// Same-origin passthrough for CDN videos so canvas frame capture in the
// Exercise Thumbnail Generator is not subject to the CDN's CORS caching.
async function handle(request: NextRequest) {
  const session = await getUserAndSession()
  if (!session) {
    logger.warn('adminboard.video-proxy.unauthorized')
    return new Response('Unauthorized', { status: 401 })
  }

  const resolved = resolveVideoProxyTarget(
    request.nextUrl.searchParams.get('url'),
  )
  if (!resolved.ok) {
    return new Response(resolved.message, { status: resolved.status })
  }

  const upstreamHeaders = new Headers()
  const range = request.headers.get('Range')
  if (range) {
    upstreamHeaders.set('Range', range)
  }

  const upstream = await fetch(resolved.target.toString(), {
    method: request.method,
    headers: upstreamHeaders,
  })

  const responseHeaders = new Headers()
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name)
    if (value) {
      responseHeaders.set(name, value)
    }
  }
  responseHeaders.set('Cache-Control', 'private, max-age=3600')

  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export const GET = handle
export const HEAD = handle
