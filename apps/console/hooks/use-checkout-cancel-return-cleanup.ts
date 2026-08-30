'use client'

import { useEffect } from 'react'
import {
  readCheckoutReturnIntent,
  stripCheckoutReturnIntent,
} from '@/lib/subscription-checkout'

function stripCheckoutCancelFromUrl() {
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const next = stripCheckoutReturnIntent(current)
  if (next !== current) {
    window.history.replaceState(window.history.state, '', next)
  }
}

/**
 * Strips checkoutReturn=cancel after Checkout abandon. Success restore polling
 * lives only on the Checkout Success Page.
 */
export function useCheckoutCancelReturnCleanup() {
  useEffect(() => {
    if (readCheckoutReturnIntent(window.location.search) !== 'cancel') return
    stripCheckoutCancelFromUrl()
  }, [])
}
