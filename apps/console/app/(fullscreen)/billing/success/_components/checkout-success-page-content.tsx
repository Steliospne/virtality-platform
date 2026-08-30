'use client'

import { useCheckoutEntitlementRestore } from '@/hooks/use-checkout-entitlement-restore'
import { checkoutSuccessCopy } from '@/lib/checkout-success-copy'
import type { CheckoutSuccessIntent } from '@virtality/shared/utils'
import { CheckoutSuccessActivatingMessage } from './checkout-success-activating-message'
import { CheckoutSuccessHomeCta } from './checkout-success-home-cta'
import { CheckoutSuccessTimeoutMessage } from './checkout-success-timeout-message'

export function CheckoutSuccessPageContent({
  intent,
  userId,
}: {
  intent: CheckoutSuccessIntent
  userId: string
}) {
  const { entitled, isStandingPending, isActivating, timedOut } =
    useCheckoutEntitlementRestore()
  const copy = checkoutSuccessCopy(intent)
  const ctaReady = entitled && !isStandingPending

  return (
    <>
      <div className='space-y-3 text-center'>
        <h1 className='text-3xl font-bold text-balance md:text-4xl'>
          {copy.headline}
        </h1>
        <p className='text-muted-foreground mx-auto max-w-xl text-lg leading-relaxed text-pretty'>
          {copy.subcopy}
        </p>
        {isActivating ? <CheckoutSuccessActivatingMessage /> : null}
        {timedOut ? <CheckoutSuccessTimeoutMessage userId={userId} /> : null}
      </div>
      <CheckoutSuccessHomeCta enabled={ctaReady} />
    </>
  )
}
