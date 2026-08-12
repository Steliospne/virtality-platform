'use client'

import { useEffect, useState } from 'react'
import { Button } from '@virtality/ui/components/button'
import posthog from 'posthog-js'
import { usePathname } from 'next/navigation'
import { getWebsiteUrl } from '@virtality/shared/types'

const NOTICE_ACK_KEY = 'analytics:notice-acknowledged'
const websiteURL = getWebsiteUrl()

const hiddenRoutes = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/password-setup',
  '/verify-email',
  '/goodbye',
]

export default function CookieBanner() {
  const pathname = usePathname()
  // Start acknowledged to avoid a flash before localStorage is read.
  const [acknowledged, setAcknowledged] = useState(true)

  useEffect(() => {
    // Keep default analytics opt-in; this notice is acknowledgment only.
    posthog.opt_in_capturing()
    if (localStorage.getItem('analytics:consent') !== 'granted') {
      localStorage.setItem('analytics:consent', 'granted')
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAcknowledged(localStorage.getItem(NOTICE_ACK_KEY) === '1')
  }, [])

  const handleUnderstand = () => {
    localStorage.setItem(NOTICE_ACK_KEY, '1')
    localStorage.setItem('analytics:consent', 'granted')
    posthog.opt_in_capturing()
    setAcknowledged(true)
  }

  const isHiddenRoute = hiddenRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (isHiddenRoute || acknowledged || !posthog.__loaded) {
    return null
  }

  return (
    <section className='pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-6 sm:bottom-6'>
      <div className='pointer-events-auto w-full max-w-xl rounded-2xl border border-zinc-300/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85'>
        <div className='flex flex-col gap-3'>
          <div className='space-y-1'>
            <p className='text-vital-blue-700 dark:text-vital-blue-300 text-[11px] font-semibold tracking-[0.2em] uppercase'>
              Notice
            </p>
            <p className='text-sm leading-relaxed text-zinc-700 dark:text-zinc-200'>
              By choosing to use Virtality, you agree to our{' '}
              <a
                href={`${websiteURL}/terms`}
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-vital-blue-700 underline'
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href={`${websiteURL}/privacy`}
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-vital-blue-700 underline'
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
          <div className='flex self-end'>
            <Button
              type='button'
              variant='primary'
              size='sm'
              onClick={handleUnderstand}
              className='w-full shrink-0 sm:w-auto'
            >
              Understand
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
