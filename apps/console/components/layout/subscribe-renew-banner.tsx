'use client'

import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { authClient } from '@/auth-client'
import { useBillingFeatureEnabled } from '@/hooks/use-billing-feature'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'
import { profileBillingHref } from '@/lib/renew-prompt-dismiss'

/**
 * Navigation bar banner for Free plan and expired seats: prompts Subscribe or
 * Renew before VR programs are blocked. Hidden for live entitled seats (paid
 * Default and active trials), so it never overlaps RenewPromptBanner's
 * upcoming-renewal reminder. Gated by `useBillingFeatureEnabled` (preview/local only).
 */
export function SubscribeRenewBanner() {
  const { data: session } = authClient.useSession()
  const billingEnabled = useBillingFeatureEnabled()
  const { isPending, checkoutCta, checkoutCtaLabel } =
    useLiveEntitlementStanding()
  const userId = session?.user?.id

  const visible =
    billingEnabled && !isPending && userId != null && checkoutCtaLabel != null

  if (!visible || !userId) return null

  const message =
    checkoutCta === 'renew'
      ? 'Your subscription has expired. Renew to keep using VR programs.'
      : 'You are on the Free plan. Subscribe to unlock VR programs.'

  return (
    <div
      role='status'
      className='flex min-w-0 flex-1 items-center justify-center gap-3 rounded-full bg-amber-100/80 px-3 py-1.5 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:ring-amber-900/50'
    >
      <p className='truncate text-sm font-medium text-amber-900 dark:text-amber-100'>
        {message}
      </p>
      <Button asChild variant='primary' size='sm' className='shrink-0'>
        <Link href={profileBillingHref(userId)}>
          <CreditCard />
          {checkoutCtaLabel}
        </Link>
      </Button>
    </div>
  )
}
