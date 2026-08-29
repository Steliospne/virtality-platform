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
 * end seats, plus Subscribe / Renew CTA when not entitled and Billing Path
 * Established. Gated by PostHog `billing_feature` (virtality.app only). CTA
 * opens Profile → Billing.
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
            className='text-base'
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
