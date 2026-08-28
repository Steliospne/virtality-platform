'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { authClient } from '@/auth-client'
import { scheduleCyclePlanChange } from '@/lib/subscription-cycle-plan-change'
import { startProSubscriptionCheckout } from '@/lib/subscription-checkout'

/**
 * Starts Better Auth Stripe Checkout (canonical pro plan) from Subscribe /
 * Renew / Update CTAs. Redirects to Stripe on success; toasts on failure.
 *
 * `annual` selects yearly vs monthly Price on the same `pro` plan.
 * `scheduleAtPeriodEnd` routes through the shared Cycle plan change module.
 */
export function useSubscriptionCheckout() {
  const [isStarting, setIsStarting] = useState(false)

  const startCheckout = async (options?: {
    annual?: boolean
    scheduleAtPeriodEnd?: boolean
  }) => {
    if (isStarting)
      return { ok: false as const, message: 'Checkout already starting' }

    setIsStarting(true)
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`

      const result = options?.scheduleAtPeriodEnd
        ? await scheduleCyclePlanChange({
            upgrade: (input) => authClient.subscription.upgrade(input),
            returnUrl,
            annual: options.annual ?? false,
          })
        : await startProSubscriptionCheckout({
            upgrade: (input) => authClient.subscription.upgrade(input),
            returnUrl,
            annual: options?.annual,
            scheduleAtPeriodEnd: false,
          })

      if (!result.ok) {
        toast.error(result.message)
      } else if (options?.scheduleAtPeriodEnd) {
        toast.success(
          'Plan change scheduled. It starts at your next billing cycle.',
        )
      }
      return result
    } finally {
      setIsStarting(false)
    }
  }

  return {
    startCheckout,
    isStarting,
  }
}
