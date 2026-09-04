import { NextRequest, NextResponse } from 'next/server'
import { evaluateSessionGate } from '@/lib/session-gate'

const { enabled } = process.env

export async function proxy(request: NextRequest) {
  const url = new URL(request.url)

  if (url.pathname === '/userCreation' && (enabled === 'false' || true)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const decision = await evaluateSessionGate(request.headers)

  if (decision === 'sign-in') {
    return NextResponse.redirect(new URL('/log-in', request.url))
  }

  if (decision === 'no-access') {
    return NextResponse.redirect(new URL('/no-access', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!^$|api|_next/static|_next/image|favicon.ico|sign-up|userCreation|log-in|no-access).*)',
  ],
}
