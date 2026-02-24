// app/posthog.js
import { PostHog } from 'posthog-node'

export default function PostHogClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY)
    throw new Error('POSTHOG_KEY missing.')

  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })
  return posthogClient
}
