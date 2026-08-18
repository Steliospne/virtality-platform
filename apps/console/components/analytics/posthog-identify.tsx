'use client'

import { usePostHogIdentifyOnSession } from '@/hooks/use-posthog-identify-on-session'

/** Mount once under the app root so PostHog flags refresh after client-side sign-in. */
const PostHogIdentify = () => {
  usePostHogIdentifyOnSession()
  return null
}

export default PostHogIdentify
