'use client'

import { useLegacyCheckoutSuccessRedirect } from '@/hooks/use-legacy-checkout-success-redirect'
import { useCheckoutCancelReturnCleanup } from '@/hooks/use-checkout-cancel-return-cleanup'

/**
 * App-wide Checkout return handling: legacy success redirect and cancel cleanup.
 * Entitlement restore after success runs only on `/billing/success`.
 */
export function CheckoutReturnHandler() {
  useLegacyCheckoutSuccessRedirect()
  useCheckoutCancelReturnCleanup()
  return null
}
