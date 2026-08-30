'use client'

import { CheckoutSuccessCelebrationLazy } from '@/components/checkout-success/checkout-success-celebration-lazy'
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
    <section className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-10'>
      <CheckoutSuccessCelebrationLazy intent={intent} />
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
    </section>
  )
}
