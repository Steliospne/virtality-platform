import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import acceptLanguage from 'accept-language'
import { settings } from '@/i18n/settings'
import { auth } from '@virtality/auth/console'
import {
  WEBSITE_URL,
  WEBSITE_URL_STAGING,
  WEBSITE_URL_LOCAL,
} from '@virtality/shared/types'

acceptLanguage.languages(settings.languages)

const env = process.env.ENV || 'development'

const websiteURL =
  env === 'production'
    ? WEBSITE_URL
    : env === 'preview'
      ? WEBSITE_URL_STAGING
      : WEBSITE_URL_LOCAL

const whiteList = [
  'api',
  'ph',
  '_next',
  '_next/static',
  '_next/image',
  'favicon.ico',
  'sign-in',
  'sign-up',
  'verify-email',
  'reset-password',
  'forgot-password',
  'auth',
  'goodbye',
]

/** Paths that must never run session/auth logic (early exit, no async work). */
const publicPathPrefixes = [
  '/sign-in',
  '/sign-up',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/goodbye',
  '/auth',
  '/api',
  '/ph',
  '/_next',
]

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Early exit for public/auth paths: skip session check entirely (avoids redirect + extra work on full page load).
  if (
    publicPathPrefixes.some(
      (p) => pathname === p || pathname.startsWith(p + '/'),
    )
  ) {
    return NextResponse.next()
  }

  let response

  response = await sessionHandler(request)
  if (response) return response

  response = await languageHandler(request)
  if (response) return response

  // If no handler returned anything special, continue
  return NextResponse.next()
}

export const config = {
  matcher: [
    {
      source:
        '/((?!^$|api|ph|_next/static|_next/image|favicon.ico|sign-in|sign-up|verify-email|forgot-password|reset-password|goodbye).*)',
      missing: [
        { type: 'header', key: 'next-action' },
        { type: 'header', key: 'x-action' },
      ],
    },
  ],
}

const sessionHandler = async (request: NextRequest) => {
  const pathName = request.nextUrl.pathname
  // pathName has leading slash (e.g. "/sign-up"); whiteList has segments without (e.g. "sign-up")
  const pathSegment = pathName.replace(/^\//, '').split('/')[0] ?? ''
  if (pathSegment && whiteList.includes(pathSegment)) {
    return null
  }

  const waitlistURL = new URL(websiteURL + '/waitlist', request.url)
  const signInURL = new URL('/sign-in', request.url)

  const data = await auth.api.getSession({
    headers: await headers(),
  })

  if (!data) return NextResponse.redirect(signInURL)

  const {
    user: { stripeCustomerId, role },
  } = data

  if (role === 'admin' || role === 'tester') return null

  if (!stripeCustomerId) {
    return NextResponse.redirect(waitlistURL)
  } else {
    try {
      const activeSubscriptions = await auth.api.listActiveSubscriptions({
        headers: await headers(),
      })

      const hasSubscription = activeSubscriptions.find(
        (as) =>
          as.stripeCustomerId === stripeCustomerId && as.status === 'active',
      )

      if (!hasSubscription) return NextResponse.redirect(waitlistURL)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }
  return null
}

const languageHandler = async (request: NextRequest) => {
  // Ignore paths with "icon" or "chrome"
  const hasReferer = request.headers.has('referer')

  if (
    request.nextUrl.pathname.indexOf('icon') > -1 ||
    request.nextUrl.pathname.indexOf('chrome') > -1
  )
    return null

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
    const response = NextResponse.next({ headers })
    if (lngInReferer) response.cookies.set(settings.cookieName, lngInReferer)
    return response
  }

  return NextResponse.next({ headers })
}
