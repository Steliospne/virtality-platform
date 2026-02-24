import { NextResponse } from 'next/server'

const { DOMAIN_URL } = process.env

export function GET() {
  return NextResponse.redirect(`${DOMAIN_URL}/waitlist`)
}
