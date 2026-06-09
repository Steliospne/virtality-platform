import { NextResponse } from 'next/server'
import { getWebsiteUrl } from '@virtality/shared/types'
import { serverLogger } from '@/lib/server-logger'

const logger = serverLogger.child({
  component: 'website-shortlink-route',
})

const websiteURL = getWebsiteUrl()

export function GET() {
  logger.info('website.shortlink.redirect', {
    sourcePath: '/01fdfe95',
    targetPath: '/waitlist',
  })
  return NextResponse.redirect(`${websiteURL}/waitlist`)
}
