import posthog from 'posthog-js'

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

// Missing analytics config must not throw — this module runs during client
// bootstrap, and an uncaught error prevents hydration (icons, carousels,
// marquees, and other client effects never run).
if (!posthogToken) {
  console.error(
    'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not set — PostHog is disabled',
  )
} else {
  posthog.init(posthogToken, {
    api_host: '/ph',
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-05-30',
    persistence: 'localStorage+cookie',
    cookieless_mode: 'on_reject',
    loaded: (client) => {
      const consent = localStorage.getItem('analytics:consent')
      if (consent === 'granted') {
        client.opt_in_capturing()
      }
    },
  })
}
