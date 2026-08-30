import {
  shouldRouteSubscribeCheckoutViaAssignedVariant,
  type CheckoutSuccessIntent,
} from '@virtality/shared/utils'

export type CheckoutSuccessIntentStanding = {
  plan: string | null | undefined
  status: string | null | undefined
  hadPaidBilling?: boolean
}

export function resolveCheckoutSuccessIntent(
  standing?: CheckoutSuccessIntentStanding,
): CheckoutSuccessIntent {
  if (
    standing &&
    shouldRouteSubscribeCheckoutViaAssignedVariant({
      plan: standing.plan,
      status: standing.status,
    })
  ) {
    return 'subscribe'
  }
  return standing?.hadPaidBilling ? 'renew' : 'subscribe'
}
