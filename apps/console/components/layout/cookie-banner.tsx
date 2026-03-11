'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import posthog from 'posthog-js'
import { usePathname } from 'next/navigation'

const hiddenRoutes = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/goodbye',
]

export default function CookieBanner() {
  const pathname = usePathname()
  const [consentGiven, setConsentGiven] = useState<
    'granted' | 'denied' | 'pending'
  >('denied')

  useEffect(() => {
    const hasGivenConsent = posthog.get_explicit_consent_status()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsentGiven(hasGivenConsent)
  }, [])

  const handleAcceptConsent = () => {
    posthog.opt_in_capturing()
    localStorage.setItem('analytics:consent', 'granted')
    setConsentGiven('granted')
  }

  const handleDeclineConsent = () => {
    posthog.opt_out_capturing()
    localStorage.setItem('analytics:consent', 'denied')
    setConsentGiven('denied')
  }

  const isHiddenRoute = hiddenRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (isHiddenRoute || consentGiven !== 'pending' || !posthog.__loaded) {
    return null
  }

  return (
    <section className='pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-6 sm:bottom-6'>
      <div className='pointer-events-auto w-full max-w-xl rounded-2xl border border-zinc-300/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85'>
        <div className='flex flex-col gap-3'>
          <div className='space-y-1'>
            <p className='text-vital-blue-700 dark:text-vital-blue-300 text-[11px] font-semibold tracking-[0.2em] uppercase'>
              Cookie note
            </p>
            <p className='text-sm leading-relaxed text-zinc-700 dark:text-zinc-200'>
              We only use first-party cookies to remember your preferences and
              make your experience smoother.
            </p>
          </div>
          <div className='flex gap-2 self-end'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleDeclineConsent}
              className='w-full shrink-0 sm:w-auto'
            >
              Decline cookies
            </Button>
            <Button
              type='button'
              variant='primary'
              size='sm'
              onClick={handleAcceptConsent}
              className='w-full shrink-0 sm:w-auto'
            >
              Accept cookies
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
