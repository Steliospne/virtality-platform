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
  const { state, isMobile, setOpenMobile } = useSidebar()
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
  const collapsed = state === 'collapsed' && !isMobile
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
          <SidebarMenuButton
            className={cn(
              'h-auto cursor-default justify-center gap-2 border border-zinc-200 py-2 text-base hover:bg-transparent hover:text-current active:bg-transparent active:text-current dark:border-zinc-800',
              isCanceled
                ? 'border-amber-200 text-amber-700 dark:border-amber-900 dark:text-amber-300'
                : 'border-green-200 text-green-700 dark:border-green-900 dark:text-green-300',
            )}
            tooltip={isCanceled ? 'Canceled' : 'Active'}
          >
            {collapsed ? (
              <CreditCard />
            ) : (
              <span className='flex min-w-0 flex-col items-start leading-tight'>
                <span
                  className={
                    isCanceled
                      ? 'text-xs text-amber-700 dark:text-amber-300'
                      : 'text-muted-foreground text-xs'
                  }
                >
                  Subscription
                </span>
                <span className='flex items-center gap-1.5'>
                  <CreditCard className='size-4 shrink-0' />
                  <span className='truncate font-medium'>
                    {isCanceled ? 'Canceled' : 'Active'}
                  </span>
                </span>
              </span>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : null}
      {showCheckoutCta ? (
        <SidebarMenuItem>
          <SidebarMenuButton
            className='bg-vital-blue-700 hover:bg-vital-blue-700/90 dark:bg-vital-blue-100 dark:hover:bg-vital-blue-100/90 justify-center text-center text-base font-medium text-zinc-50 shadow hover:text-zinc-50 dark:text-zinc-900 dark:hover:text-zinc-900'
            tooltip={checkoutCtaLabel}
            asChild
          >
            <Link
              href={profileBillingHref(userId)}
              onClick={() => {
                if (isMobile) setOpenMobile(false)
              }}
            >
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
              'h-auto cursor-default justify-center gap-2 border border-zinc-200 py-2 text-base hover:bg-transparent hover:text-current active:bg-transparent active:text-current dark:border-zinc-800',
              isExpired &&
                'border-red-200 text-red-600 dark:border-red-900 dark:text-red-500',
            )}
            tooltip={`${display}`}
          >
            {collapsed ? (
              <Clock
                className={isExpired ? 'text-red-600 dark:text-red-500' : ''}
              />
            ) : (
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
                <span className='flex items-center gap-1.5'>
                  <Clock
                    className={cn(
                      'size-4 shrink-0',
                      isExpired && 'text-red-600 dark:text-red-500',
                    )}
                  />
                  <span className='truncate font-medium'>{display}</span>
                </span>
              </span>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : null}
    </SidebarMenu>
  )
}
