'use client'

import Link from 'next/link'
import { Clock, CreditCard } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { authClient } from '@/auth-client'
import { useBillingFeatureEnabled } from '@/hooks/use-billing-feature'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'
import { profileBillingHref } from '@/lib/renew-prompt-dismiss'
import { cn } from '@/lib/utils'

/**
 * Remaining Time from the Entitlement Clock during trials and cancel-at-period-
 * end seats, plus Subscribe / Renew CTA for trialing users and when not
 * entitled and Billing Path Established. Gated by `useBillingFeatureEnabled`
 * (preview/local only). CTA opens Profile → Billing.
 */
export function RemainingTimeSidebar() {
  const { state } = useSidebar()
  const { data: session } = authClient.useSession()
  const billingEnabled = useBillingFeatureEnabled()
  const {
    label,
    checkoutCtaLabel,
    isPending,
    showRemainingTime,
    entitled,
    subscribed,
    cancelAtPeriodEnd,
  } = useLiveEntitlementStanding()
  const collapsed = state === 'collapsed'
  const display = isPending ? '…' : label
  const userId = session?.user?.id
  const showCheckoutCta = !isPending && checkoutCtaLabel != null && userId
  const isExpired = !isPending && !entitled
  const showSubscribed = !isPending && subscribed
  const isCanceled = showSubscribed && Boolean(cancelAtPeriodEnd)

  if (!billingEnabled) return null
  if (!showCheckoutCta && !showRemainingTime && !showSubscribed) return null

  return (
    <SidebarMenu>
      {showSubscribed ? (
        <SidebarMenuItem>
          <span
            className={cn(
              'block py-2 text-center text-base font-medium',
              isCanceled
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-green-700 dark:text-green-300',
              collapsed && 'sr-only',
            )}
          >
            {isCanceled ? 'Canceled' : 'Subscribed'}
          </span>
        </SidebarMenuItem>
      ) : null}
      {showCheckoutCta ? (
        <SidebarMenuItem>
          <SidebarMenuButton
            className='bg-vital-blue-700 hover:bg-vital-blue-700/90 dark:bg-vital-blue-100 dark:hover:bg-vital-blue-100/90 justify-center text-center text-base font-medium text-zinc-50 shadow hover:text-zinc-50 dark:text-zinc-900 dark:hover:text-zinc-900'
            tooltip={checkoutCtaLabel}
            asChild
          >
            <Link href={profileBillingHref(userId)}>
              <CreditCard />
              {!collapsed && <span>{checkoutCtaLabel}</span>}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : null}
      {showRemainingTime ? (
        <SidebarMenuItem className={showCheckoutCta ? 'mt-3' : undefined}>
          <SidebarMenuButton
            className={cn(
              'h-auto cursor-default justify-center gap-2 py-2 text-base hover:bg-transparent hover:text-current active:bg-transparent active:text-current',
              isExpired && 'text-red-600 dark:text-red-500',
            )}
            tooltip={`${display}`}
          >
            <Clock
              className={isExpired ? 'text-red-600 dark:text-red-500' : ''}
            />
            {!collapsed && (
              <span className='flex min-w-0 flex-col items-start leading-tight'>
                <span
                  className={
                    isExpired
                      ? 'text-xs text-red-600 dark:text-red-500'
                      : 'text-muted-foreground text-xs'
                  }
                >
                  Remaining Time
                </span>
                <span className='truncate font-medium'>{display}</span>
              </span>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : null}
    </SidebarMenu>
  )
}
