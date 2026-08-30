'use client'

import { useEffect } from 'react'
import { resolveLegacyCheckoutSuccessRedirect } from '@virtality/shared/utils'

/**
 * Legacy Checkout success returns may still land with checkoutReturn=success on
 * non-success routes. Redirect into the Checkout Success Page without a second
 * restore poll on Profile or other return pages.
 */
export function useLegacyCheckoutSuccessRedirect() {
  useEffect(() => {
    const target = resolveLegacyCheckoutSuccessRedirect(
      window.location.pathname,
      window.location.search,
    )
    if (target) {
      window.location.replace(target)
    }
  }, [])
}
