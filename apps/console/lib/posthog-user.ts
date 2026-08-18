import type posthog from 'posthog-js'

export type PostHogIdentifiableUser = {
  id: string
  email: string
  name?: string | null
}

type PostHogClient = Pick<typeof posthog, 'identify' | 'reloadFeatureFlags'>

/** Tie PostHog person properties to the auth session and refresh flag payloads. */
export function identifyPostHogUser(
  client: PostHogClient,
  user: PostHogIdentifiableUser,
): void {
  client.identify(
    user.id,
    {
      email: user.email,
      name: user.name ?? undefined,
    },
    () => {
      client.reloadFeatureFlags()
    },
  )
}
