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

/**
 * Remaining Time from the Entitlement Clock during trials and cancel-at-period-
 * end seats, plus Subscribe / Renew CTA for trialing users and when not
 * entitled and Billing Path Established. Gated by PostHog `billing_feature`
 * (virtality.app only). CTA opens Profile → Billing.
 */
export function RemainingTimeSidebar() {
  const { state } = useSidebar()
  const { data: session } = authClient.useSession()
  const billingEnabled = useBillingFeatureEnabled()
  const { label, checkoutCtaLabel, isPending, showRemainingTime } =
    useLiveEntitlementStanding()
  const collapsed = state === 'collapsed'
  const display = isPending ? '…' : label
  const userId = session?.user?.id
  const showCheckoutCta = !isPending && checkoutCtaLabel != null && userId

  if (!billingEnabled) return null
  if (!showCheckoutCta && !showRemainingTime) return null

  return (
    <SidebarMenu>
      {showCheckoutCta ? (
        <SidebarMenuItem>
          <SidebarMenuButton
            className='bg-vital-blue-700 justify-center text-center text-base font-medium text-zinc-50 shadow hover:bg-vital-blue-700/90 hover:text-zinc-50 dark:bg-vital-blue-100 dark:text-zinc-900 dark:hover:bg-vital-blue-100/90 dark:hover:text-zinc-900'
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
        <SidebarMenuItem>
          <SidebarMenuButton
            className='pointer-events-none text-base'
            tooltip={`Remaining Time: ${display}`}
          >
            <Clock />
            {!collapsed && (
              <span className='flex min-w-0 flex-col items-start leading-tight'>
                <span className='text-muted-foreground text-xs'>
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
