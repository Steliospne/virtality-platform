'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TRIAL_WELCOME_PATH } from '@virtality/shared/utils'
import { useEntitlementStanding } from '@virtality/react-query'

export function TrialWelcomeRedirect() {
  const router = useRouter()
  const standing = useEntitlementStanding()

  useEffect(() => {
    if (standing.data?.needsTrialWelcome) {
      router.replace(TRIAL_WELCOME_PATH)
    }
  }, [standing.data?.needsTrialWelcome, router])

  return null
}
