import { NextRequest, NextResponse } from 'next/server'
import acceptLanguage from 'accept-language'
import { settings } from '@/i18n/settings'
import { auth } from '@virtality/auth'
import { getWebsiteUrl } from '@virtality/shared/types'

acceptLanguage.languages(settings.languages)

const websiteURL = getWebsiteUrl()

export async function proxy(request: NextRequest) {
  let response

  response = await sessionHandler(request)

  response = await languageHandler(request)

  return response
}

export const config = {
  matcher: [
    {
      source:
        '/((?!^$|api|ph|_next/static|_next/image|favicon.ico|sign-in|sign-up|verify-email|forgot-password|reset-password|goodbye|error).*)',
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
    const data = await auth.api.getSession({
      headers: request.headers,
    })

    if (!data) return NextResponse.redirect(signInURL)

    const {
      user: { stripeCustomerId, role },
    } = data

    if (role === 'admin' || role === 'tester') return NextResponse.next()

    if (!stripeCustomerId) {
      return NextResponse.redirect(waitlistURL)
    } else {
      try {
        const activeSubscriptions = await auth.api.listActiveSubscriptions({
          headers: request.headers,
        })

        const hasSubscription = activeSubscriptions.find(
          (as) =>
            as.stripeCustomerId === stripeCustomerId && as.status === 'active',
        )

        if (!hasSubscription) {
          await auth.api.signOut({
            headers: request.headers,
          })
          return NextResponse.redirect(waitlistURL)
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
      }
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
