'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { authClient } from '@/auth-client'
import { startProSubscriptionCheckout } from '@/lib/subscription-checkout'

/**
 * Starts Better Auth Stripe Checkout (canonical pro plan) from Subscribe /
 * Renew CTAs. Redirects to Stripe on success; toasts on failure.
 *
 * `annual` selects yearly vs monthly Price on the same `pro` plan.
 */
export function useSubscriptionCheckout() {
  const [isStarting, setIsStarting] = useState(false)

  const startCheckout = async (options?: { annual?: boolean }) => {
    if (isStarting) return

    setIsStarting(true)
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`

      const result = await startProSubscriptionCheckout({
        upgrade: (input) => authClient.subscription.upgrade(input),
        returnUrl,
        annual: options?.annual,
      })

      if (!result.ok) {
        toast.error(result.message)
      }
    } finally {
      setIsStarting(false)
    }
  }

  return {
    startCheckout,
    isStarting,
  }
}
