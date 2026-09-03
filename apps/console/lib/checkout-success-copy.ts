import type { CheckoutSuccessIntent } from '@virtality/shared/utils'

export type CheckoutSuccessCopy = {
  headline: string
  subcopy: string
}

export function checkoutSuccessCopy(
  intent: CheckoutSuccessIntent,
): CheckoutSuccessCopy {
  switch (intent) {
    case 'subscribe':
      return {
        headline: "You're in.",
        subcopy:
          "Default is yours now. Here's to more time with your patients.",
      }
    case 'renew':
      return {
        headline: 'Thanks for staying with us.',
        subcopy: 'Your Default access carries on, no gap, no hassle.',
      }
  }
}
