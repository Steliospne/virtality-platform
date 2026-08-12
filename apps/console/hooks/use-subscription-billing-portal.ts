'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { authClient } from '@/auth-client'
import { startProBillingPortal } from '@/lib/subscription-billing-portal'

/**
 * Opens Stripe Customer Portal via Better Auth for the signed-in user.
 * Redirects to Stripe on success; toasts on failure.
 */
export function useSubscriptionBillingPortal() {
  const [isStarting, setIsStarting] = useState(false)

  const startPortal = async () => {
    if (isStarting) return

    setIsStarting(true)
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`

      const result = await startProBillingPortal({
        billingPortal: (input) => authClient.subscription.billingPortal(input),
        returnUrl,
      })

      if (!result.ok) {
        toast.error(result.message)
      }
    } finally {
      setIsStarting(false)
    }
  }

  return {
    startPortal,
    isStarting,
  }
}
