'use client'

import { useSearchParams } from 'next/navigation'
import { authClient } from '@/auth-client'
import { readCheckoutSuccessIntent } from '@/lib/subscription-checkout'
import { CheckoutSuccessPageContent } from './checkout-success-page-content'

export function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const { data: session } = authClient.useSession()
  const intent = readCheckoutSuccessIntent(searchParams) ?? 'subscribe'
  const userId = session?.user?.id

  if (!userId) {
    return (
      <section className='mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-6'>
        <p className='text-muted-foreground text-sm'>Signing you in…</p>
      </section>
    )
  }

  return <CheckoutSuccessPageContent intent={intent} userId={userId} />
}
