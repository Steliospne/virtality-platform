'use client'

import { useEffect, useState } from 'react'
import { Button } from '@virtality/ui/components/button'
import posthog from 'posthog-js'

export default function CookieBanner() {
  const [consentGiven, setConsentGiven] = useState<
    'granted' | 'denied' | 'pending'
  >('denied')

  useEffect(() => {
    if (
      !posthog.__loaded ||
      typeof posthog.get_explicit_consent_status !== 'function'
    ) {
      return
    }

    setConsentGiven(posthog.get_explicit_consent_status())
  }, [])

  const handleAcceptConsent = () => {
    if (typeof posthog.opt_in_capturing === 'function') {
      posthog.opt_in_capturing()
    }
    localStorage.setItem('analytics:consent', 'granted')
    setConsentGiven('granted')
  }

  const handleDeclineConsent = () => {
    if (typeof posthog.opt_out_capturing === 'function') {
      posthog.opt_out_capturing()
    }
    localStorage.setItem('analytics:consent', 'denied')
    setConsentGiven('denied')
  }

  if (consentGiven !== 'pending' || !posthog.__loaded) {
    return null
  }

  return (
    <section className='pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-6 sm:bottom-6'>
      <div className='pointer-events-auto w-full max-w-sm rounded-2xl border border-vital-blue-100/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md sm:max-w-md'>
        <div className='flex flex-col gap-3'>
          <div className='space-y-1'>
            <p className='text-vital-blue-700 text-[11px] font-semibold tracking-[0.2em] uppercase'>
              Cookie note
            </p>
            <p className='text-sm leading-relaxed text-slate-700'>
              We use first-party analytics cookies to understand how the site is
              used and improve it. You can accept or decline.
            </p>
          </div>
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleDeclineConsent}
              className='w-full sm:w-auto'
            >
              Decline cookies
            </Button>
            <Button
              type='button'
              variant='primary'
              size='sm'
              onClick={handleAcceptConsent}
              className='w-full sm:w-auto'
            >
              Accept cookies
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
