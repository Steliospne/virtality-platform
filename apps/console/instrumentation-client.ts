import posthog from 'posthog-js'
// import { orpc } from './integrations/orpc/client'
import { authClient } from './auth-client'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: '/ph',
  ui_host: 'https://eu.posthog.com',
  persistence: 'localStorage+cookie',
  loaded: async () => {
    const { data } = await authClient.getSession()

    if (data) {
      posthog.identify(data.user.id, {
        email: data.user.email,
        name: data.user.name,
      })
    }
  },
})
