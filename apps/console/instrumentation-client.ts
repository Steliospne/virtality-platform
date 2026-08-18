import posthog from 'posthog-js'
import { authClient } from './auth-client'
import { installTranslateCrashGuard } from './lib/translate-crash-guard'
import { identifyPostHogUser } from './lib/posthog-user'

installTranslateCrashGuard()

if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  throw new Error('POSTHOG_KEY is not set')
}

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: '/ph',
  ui_host: 'https://eu.posthog.com',
  persistence: 'localStorage+cookie',
  cookieless_mode: 'on_reject',
  autocapture: { url_ignorelist: ['http:localhost:3001'] },
  loaded: async (posthogClient) => {
    try {
      // Console defaults to opted-in so feature flags (e.g. billing_feature)
      // and identify run without waiting on the cookie banner. Explicit
      // declines in localStorage are still respected.
      const consent = localStorage.getItem('analytics:consent')
      if (consent === 'denied') {
        posthogClient.opt_out_capturing()
      } else {
        posthogClient.opt_in_capturing()
        if (consent !== 'granted') {
          localStorage.setItem('analytics:consent', 'granted')
        }
      }

      const { data } = await authClient.getSession()
      if (!data) return

      identifyPostHogUser(posthogClient, data.user)
    } catch (error) {
      console.error('Error initializing PostHog:', error)
    }
  },
})
