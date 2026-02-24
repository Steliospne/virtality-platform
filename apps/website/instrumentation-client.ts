import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST,
  capture_pageview: 'history_change',
})
