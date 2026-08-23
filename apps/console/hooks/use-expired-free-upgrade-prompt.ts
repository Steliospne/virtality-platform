'use client'

import { useCallback, useEffect, useState } from 'react'
import { shouldShowExpiredFreeUpgradePrompt } from '@virtality/shared/utils'
import { useEntitlementStanding } from '@virtality/react-query'
import { authClient } from '@/auth-client'
import { useBillingFeatureEnabled } from '@/hooks/use-billing-feature'
import {
  isNewAuthenticatedSession,
  readExpiredFreeUpgradePromptSession,
  recordExpiredFreeUpgradePromptShown,
} from '@/lib/expired-free-upgrade-prompt-session'

const RECURRENCE_CHECK_MS = 60_000

/**
 * Expired-Free upgrade dialog timing: every authenticated login and every twelve
 * hours during a continuous session until paid entitlement is active.
 */
export function useExpiredFreeUpgradePrompt() {
  const billingEnabled = useBillingFeatureEnabled()
  const { data: session } = authClient.useSession()
  const standingQuery = useEntitlementStanding()
  const userId = session?.user?.id ?? null
  const sessionId = session?.session?.id ?? null
  const qualifies =
    billingEnabled && (standingQuery.data?.expiredFreeUpgradeQualifies ?? false)

  const [hydrated, setHydrated] = useState(false)
  const [open, setOpen] = useState(false)

  const markPromptShown = useCallback(() => {
    if (!userId || !sessionId) return
    recordExpiredFreeUpgradePromptShown(window.sessionStorage, userId, {
      now: new Date(),
      sessionId,
    })
  }, [userId, sessionId])

  const shouldShowNow = useCallback(() => {
    if (!qualifies || !userId || !sessionId) return false
    const { lastPromptAt, seenSessionId } = readExpiredFreeUpgradePromptSession(
      window.sessionStorage,
      userId,
    )
    return shouldShowExpiredFreeUpgradePrompt({
      qualifies: true,
      now: new Date(),
      lastPromptAt,
      isNewAuthenticatedSession: isNewAuthenticatedSession(
        seenSessionId,
        sessionId,
      ),
    })
  }, [qualifies, userId, sessionId])

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    setOpen(shouldShowNow())
  }, [hydrated, shouldShowNow])

  useEffect(() => {
    if (!hydrated || !qualifies) return
    const id = window.setInterval(() => {
      if (!open && shouldShowNow()) {
        setOpen(true)
      }
    }, RECURRENCE_CHECK_MS)
    return () => window.clearInterval(id)
  }, [hydrated, qualifies, open, shouldShowNow])

  useEffect(() => {
    if (!open) return
    markPromptShown()
  }, [open, markPromptShown])

  const dismiss = useCallback(() => {
    markPromptShown()
    setOpen(false)
  }, [markPromptShown])

  return {
    open: qualifies && open,
    dismiss,
    userId,
  }
}
