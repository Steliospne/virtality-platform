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
        headline: 'Welcome aboard',
        subcopy:
          'Your subscription is on its way. We are activating your access now.',
      }
    case 'renew':
      return {
        headline: 'You are renewed',
        subcopy:
          'Thanks for staying with us. We are activating your access now.',
      }
  }
}
