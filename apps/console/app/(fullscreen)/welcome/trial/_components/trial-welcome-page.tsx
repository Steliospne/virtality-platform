'use client'

import { authClient } from '@/auth-client'
import useMounted from '@/hooks/use-mounted'
import { CheckoutSuccessHomeCta } from '../../../billing/success/_components/checkout-success-home-cta'
import { TrialWelcomeConfettiLazy } from './trial-welcome-confetti-lazy'

export function TrialWelcomePage() {
  const mounted = useMounted()
  const { data: session, isPending } = authClient.useSession()

  // Keep SSR and the first client paint on the same shell (confetti only).
  const ready = mounted && !isPending && Boolean(session?.user?.id)

  return (
    <section className='relative flex min-h-svh w-full flex-col items-center justify-center gap-8 overflow-hidden px-6 py-12'>
      <div aria-hidden className='bg-background absolute inset-0 -z-20' />
      <TrialWelcomeConfettiLazy />
      {ready ? (
        <div className='relative z-10 space-y-8 text-center'>
          <div className='space-y-3'>
            <h1 className='text-3xl font-bold text-balance md:text-4xl'>
              Welcome to your trial.
            </h1>
            <p className='text-muted-foreground mx-auto max-w-xl text-lg leading-relaxed text-pretty'>
              Full access is unlocked. Explore Virtality at your own pace and
              see what fits your practice.
            </p>
          </div>
          <CheckoutSuccessHomeCta enabled />
        </div>
      ) : null}
    </section>
  )
}
