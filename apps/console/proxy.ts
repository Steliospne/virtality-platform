import { NextRequest, NextResponse } from 'next/server'
import acceptLanguage from 'accept-language'
import { settings } from '@/i18n/settings'
import { getWebsiteUrl } from '@virtality/shared/types'
import { buildSignInHref } from '@/lib/sign-in-redirect'
import { evaluateSessionGate } from '@/lib/session-gate'

acceptLanguage.languages(settings.languages)

const websiteURL = getWebsiteUrl()

export async function proxy(request: NextRequest) {
  const sessionResponse = await sessionHandler(request)
  // Preserve sign-in / waitlist redirects; language headers only on passthrough.
  if (sessionResponse.headers.get('location')) {
    return sessionResponse
  }

  return languageHandler(request)
}

export const config = {
  matcher: [
    {
      source:
        '/((?!^$|api|ph|_next/static|_next/image|favicon.ico|sign-in|sign-up|verify-email|forgot-password|reset-password|password-setup|goodbye|error).*)',
      missing: [
        { type: 'header', key: 'next-action' },
        { type: 'header', key: 'x-action' },
      ],
    },
  ],
}

const sessionHandler = async (request: NextRequest) => {
  const { decision, setCookies } = await evaluateSessionGate(request.headers)

  if (decision === 'sign-in') {
    const signInURL = new URL(
      buildSignInHref(`${request.nextUrl.pathname}${request.nextUrl.search}`),
      request.url,
    )
    return NextResponse.redirect(signInURL)
  }

  if (decision === 'waitlist') {
    const waitlistURL = new URL(websiteURL + '/waitlist', request.url)
    const response = NextResponse.redirect(waitlistURL)
    // Relay the server's sign-out Set-Cookie so the browser's session
    // cookie actually clears, since the auth call happened over HTTP.
    for (const cookie of setCookies) {
      response.headers.append('set-cookie', cookie)
    }
    return response
  }

  return NextResponse.next()
}

const languageHandler = async (request: NextRequest) => {
  // Ignore paths with "icon" or "chrome"
  const hasReferer = request.headers.has('referer')

  if (
    request.nextUrl.pathname.indexOf('icon') > -1 ||
    request.nextUrl.pathname.indexOf('chrome') > -1
  )
    return NextResponse.next()

  let lng

  if (request.cookies.has(settings.cookieName)) {
    lng = acceptLanguage.get(request.cookies.get(settings.cookieName)?.value)
  }

  if (!lng) {
    lng = acceptLanguage.get(request.headers.get('Accept-Language'))
  }

  if (!lng) lng = settings.fallbackLng

  const headers = new Headers(request.headers)
  headers.set(settings.headerName, lng)

  if (hasReferer) {
    const refererUrl = new URL(request.headers.get('referer')!)
    const lngInReferer = settings.languages.find((l) =>
      refererUrl.pathname.startsWith(`/${l}`),
    )
    if (lngInReferer) headers.set(settings.cookieName, lngInReferer)
    return NextResponse.next({ request: { headers } })
  }

  return NextResponse.next({ request: { headers } })
}
