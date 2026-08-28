'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { authClient } from '@/auth-client'
import { restoreSubscription } from '@/lib/subscription-restore'

/**
 * Better Auth `subscription.restore` via the shared Cycle plan change module
 * for period-end plan change cancel and cancel-at-period-end undo.
 */
export function useSubscriptionRestore() {
  const [isRestoring, setIsRestoring] = useState(false)

  async function runRestore(successMessage: string) {
    if (isRestoring) return { ok: false as const }

    setIsRestoring(true)
    try {
      const result = await restoreSubscription({
        restore: (input) => authClient.subscription.restore(input),
      })

      if (!result.ok) {
        toast.error(result.message)
        return result
      }

      toast.success(successMessage)
      return result
    } finally {
      setIsRestoring(false)
    }
  }

  const cancelPendingPlanChange = () =>
    runRestore('Scheduled plan change canceled. You stay on your current plan.')

  const undoPendingCancellation = () =>
    runRestore('Cancellation stopped. Your subscription will renew as usual.')

  return {
    cancelPendingPlanChange,
    undoPendingCancellation,
    isRestoring,
  }
}
