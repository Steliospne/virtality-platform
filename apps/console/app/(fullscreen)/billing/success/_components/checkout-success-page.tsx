'use client'

import { useSearchParams } from 'next/navigation'
import { CheckoutSuccessCelebrationLazy } from '@/components/checkout-success/checkout-success-celebration-lazy'
import { authClient } from '@/auth-client'
import useMounted from '@/hooks/use-mounted'
import { readCheckoutSuccessIntent } from '@/lib/subscription-checkout'
import { CheckoutSuccessAtmosphere } from './checkout-success-atmosphere'
import { CheckoutSuccessPageContent } from './checkout-success-page-content'

export function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const mounted = useMounted()
  const { data: session, isPending } = authClient.useSession()
  const intent = readCheckoutSuccessIntent(searchParams) ?? 'subscribe'
  const userId = session?.user?.id

  // Keep SSR and the first client paint on the same shell (celebration only).
  // Session can already be present on the client during hydration while the
  // server had none; gate copy/CTA until after mount so the tree matches.
  const ready = mounted && !isPending && Boolean(userId)

  return (
    <section className='relative flex min-h-svh w-full flex-col items-center justify-center gap-8 overflow-hidden px-6 py-12'>
      <CheckoutSuccessAtmosphere intent={intent} />
      <div className='relative h-[min(62vh,34rem)] w-full max-w-4xl'>
        <CheckoutSuccessCelebrationLazy intent={intent} />
      </div>
      {ready && userId ? (
        <CheckoutSuccessPageContent intent={intent} userId={userId} />
      ) : null}
    </section>
  )
}
