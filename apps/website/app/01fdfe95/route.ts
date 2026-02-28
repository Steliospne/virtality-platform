import { NextResponse } from 'next/server'
import { WEBSITE_URL, WEBSITE_URL_LOCAL } from '@virtality/shared/types'

const websiteURL =
  process.env.NODE_ENV === 'production' ? WEBSITE_URL : WEBSITE_URL_LOCAL

export function GET() {
  return NextResponse.redirect(`${websiteURL}/waitlist`)
}
