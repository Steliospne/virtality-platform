import posthog from 'posthog-js'
import { authClient } from './auth-client'

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
      const { data } = await authClient.getSession()
      if (!data) return

      const consent = localStorage.getItem('analytics:consent')

      if (consent === 'granted') posthogClient.opt_in_capturing()

      posthogClient.identify(data.user.id, {
        email: data.user.email,
        name: data.user.name,
      })
    } catch (error) {
      console.error('Error initializing PostHog:', error)
    }
  },
})
