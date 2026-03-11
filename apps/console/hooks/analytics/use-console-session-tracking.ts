'use client'
import { useEffect, useRef } from 'react'
import { trackAnalyticsEvent } from '@/lib/analytics-contract'
import { generateUUID } from '@virtality/shared/utils'

const SESSION_ID_KEY = 'analytics:session_id'
const STARTED_AT_KEY = 'analytics:session_started_at'
const LAST_ACTIVITY_KEY = 'analytics:last_activity_at'
const ENDED_KEY = 'analytics:session_ended'

const INACTIVITY_MS = 30 * 60 * 1000
const ACTIVITY_THROTTLE_MS = 1000

const now = () => Date.now()

export type ConsoleSessionEndReason =
  | 'tab_close'
  | 'inactive_timeout'
  | 'manual'

export const finalizeConsoleSession = (end_reason: ConsoleSessionEndReason) => {
  if (sessionStorage.getItem(ENDED_KEY) === '1') return false

  const startedAtRaw = sessionStorage.getItem(STARTED_AT_KEY)
  if (!startedAtRaw) return false

  const start = Number(startedAtRaw)
  const duration_sec = Math.max(0, Math.floor((now() - start) / 1000))

  trackAnalyticsEvent('console_session_ended', {
    duration_sec,
    end_reason,
    source: 'auto',
    timestamp_client: new Date().toISOString(),
  })

  sessionStorage.setItem(ENDED_KEY, '1')
  sessionStorage.removeItem(SESSION_ID_KEY)
  sessionStorage.removeItem(STARTED_AT_KEY)
  sessionStorage.removeItem(LAST_ACTIVITY_KEY)

  return true
}

function useConsoleSessionTracking() {
  const endSentRef = useRef(false)
  useEffect(() => {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
    const startedAt = Number(sessionStorage.getItem(STARTED_AT_KEY) || 0)

    if (!sessionId || !startedAt) {
      sessionId = generateUUID()

      const ts = now()

      sessionStorage.setItem(SESSION_ID_KEY, sessionId)
      sessionStorage.setItem(STARTED_AT_KEY, String(ts))
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(ts))
      sessionStorage.removeItem(ENDED_KEY)

      trackAnalyticsEvent('console_session_started', {
        source: 'auto',
        timestamp_client: new Date(ts).toISOString(),
      })
    }

    let lastActivityWriteAt = 0
    const markActivity = () => {
      const ts = now()
      if (ts - lastActivityWriteAt < ACTIVITY_THROTTLE_MS) return
      lastActivityWriteAt = ts
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(ts))
    }

    const endSession = (end_reason: ConsoleSessionEndReason) => {
      if (endSentRef.current || sessionStorage.getItem(ENDED_KEY) === '1')
        return
      const ended = finalizeConsoleSession(end_reason)
      if (ended) endSentRef.current = true
    }

    const onPageHide = () => endSession('tab_close')

    const onBeforeUnload = () => endSession('tab_close')

    const interval = window.setInterval(() => {
      const last = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY) || now())
      if (now() - last > INACTIVITY_MS) endSession('inactive_timeout')
    }, 15_000)

    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('click', markActivity)
    window.addEventListener('keydown', markActivity)
    window.addEventListener('pointerdown', markActivity)
    window.addEventListener('touchstart', markActivity)
    window.addEventListener('touchend', markActivity)

    return () => {
      clearInterval(interval)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('click', markActivity)
      window.removeEventListener('keydown', markActivity)
      window.removeEventListener('pointerdown', markActivity)
      window.removeEventListener('touchstart', markActivity)
      window.removeEventListener('touchend', markActivity)
    }
  }, [])
}

export default useConsoleSessionTracking
