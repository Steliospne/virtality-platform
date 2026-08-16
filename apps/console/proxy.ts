import { NextRequest, NextResponse } from 'next/server'
import acceptLanguage from 'accept-language'
import { settings } from '@/i18n/settings'
import { asAuthSession, auth } from '@virtality/auth'
import { prisma } from '@virtality/db'
import { decideConsoleSessionGate } from '@virtality/shared/utils'
import { getWebsiteUrl } from '@virtality/shared/types'

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
  const waitlistURL = new URL(websiteURL + '/waitlist', request.url)
  const signInURL = new URL('/sign-in', request.url)

  try {
    const data = asAuthSession(
      await auth.api.getSession({
        headers: request.headers,
      }),
    )

    if (!data) return NextResponse.redirect(signInURL)

    const {
      user: { stripeCustomerId, role },
    } = data

    // Existence only: Billing Path Established is any synced row, any status.
    const subscription = stripeCustomerId
      ? await prisma.subscription.findFirst({
          where: { stripeCustomerId },
          select: { status: true },
        })
      : null

    const decision = decideConsoleSessionGate({
      role,
      subscriptions: subscription ? [subscription] : [],
    })

    if (decision === 'waitlist') {
      // Never-established billing path only. Expiry with a synced Subscription
      // stays in console (no sign-out solely for clock end).
      await auth.api.signOut({
        headers: request.headers,
      })
      return NextResponse.redirect(waitlistURL)
    }
  } catch (error) {
    console.error('Error checking session:', error)
    // return NextResponse.redirect(new URL('/error', request.url))
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
