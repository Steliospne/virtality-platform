import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { handleRevalidateMarketingRequest } from '@/lib/revalidate-marketing'
import { serverLogger } from '@/lib/server-logger'

const logger = serverLogger.child({
  component: 'website-revalidate',
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = handleRevalidateMarketingRequest({
    authorizationHeader: request.headers.get('authorization'),
    secret: process.env.REVALIDATE_SECRET,
    body,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  try {
    for (const tag of result.tags) {
      revalidateTag(tag, { expire: 0 })
    }
  } catch (error) {
    logger.error(
      'website.revalidate.failed',
      { error, tags: result.tags },
      'revalidateTag threw',
    )
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }

  logger.info('website.revalidate.ok', { tags: result.tags })
  return NextResponse.json({ revalidated: true, tags: result.tags })
}
