'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { Clock, CreditCard, X } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { authClient } from '@/auth-client'
import { useRenewPromptSession } from '@/hooks/use-renew-prompt-session'
import {
  dismissRenewPrompt,
  isRenewPromptDismissed,
  profileBillingHref,
} from '@/lib/renew-prompt-dismiss'

/**
 * In-app renew offset chrome for the seat holder. Hidden after Entitlement
 * Clock expiry, and dismissible per clock epoch until the next re-arm.
 */
export function RenewPromptBanner() {
  const { data: session } = authClient.useSession()
  const { prompts } = useRenewPromptSession()
  const userId = session?.user?.id ?? null

  const nearestDaysBefore = useMemo(() => {
    if (prompts.length === 0) return null
    return Math.min(...prompts.map((prompt) => prompt.daysBefore))
  }, [prompts])

  const epochKey = prompts[0]?.epochKey ?? null

  const [hydrated, setHydrated] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!userId || !epochKey) {
      setHydrated(true)
      setDismissed(false)
      return
    }
    setDismissed(isRenewPromptDismissed(userId, epochKey))
    setHydrated(true)
  }, [userId, epochKey])

  const visible =
    hydrated &&
    userId != null &&
    epochKey != null &&
    nearestDaysBefore != null &&
    !dismissed

  const title =
    nearestDaysBefore === 1
      ? 'Your access renews tomorrow'
      : nearestDaysBefore != null
        ? `Your access renews in ${nearestDaysBefore} days`
        : null

  return (
    <AnimatePresence initial={false}>
      {visible && userId && epochKey && nearestDaysBefore != null && title ? (
        <motion.div
          key={`${userId}:${epochKey}`}
          role='status'
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className='overflow-hidden border-b border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:border-amber-900/50 dark:from-amber-950/50 dark:via-orange-950/30 dark:to-amber-950/40'
        >
          <div className='flex items-start gap-3 px-4 py-3 sm:items-center'>
            <div className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 ring-1 ring-amber-200/80 sm:mt-0 dark:bg-amber-900/60 dark:text-amber-100 dark:ring-amber-800/60'>
              <Clock className='size-4' aria-hidden />
            </div>

            <div className='min-w-0 flex-1'>
              <p className='text-sm font-semibold text-amber-950 dark:text-amber-50'>
                {title}
              </p>
              <p className='mt-0.5 text-sm text-amber-900/75 dark:text-amber-100/70'>
                Review your plan and billing before Remaining Time runs out.
              </p>
            </div>

            <div className='flex shrink-0 items-center gap-1.5'>
              <Button
                asChild
                variant='primary'
                size='sm'
                className='hidden sm:inline-flex'
              >
                <Link href={profileBillingHref(userId)}>
                  <CreditCard />
                  Manage billing
                </Link>
              </Button>
              <Button
                asChild
                variant='primary'
                size='icon-sm'
                className='sm:hidden'
                aria-label='Manage billing'
              >
                <Link href={profileBillingHref(userId)}>
                  <CreditCard />
                </Link>
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label='Dismiss renewal reminder'
                className='text-amber-900/70 hover:bg-amber-100/80 hover:text-amber-950 dark:text-amber-100/70 dark:hover:bg-amber-900/50 dark:hover:text-amber-50'
                onClick={() => {
                  dismissRenewPrompt(userId, epochKey)
                  setDismissed(true)
                }}
              >
                <X />
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
