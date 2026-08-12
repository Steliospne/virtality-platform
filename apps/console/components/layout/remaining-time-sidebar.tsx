'use client'

import { Clock, CreditCard } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'
import { useSubscriptionCheckout } from '@/hooks/use-subscription-checkout'

/**
 * Always-visible Remaining Time from the Entitlement Clock, plus Subscribe /
 * Renew Checkout CTA when not entitled and Billing Path Established.
 * Shows "Expired" when not entitled; remaining time never goes negative.
 * CTA starts Better Auth Stripe Checkout (mode=subscription, canonical pro).
 */
export function RemainingTimeSidebar() {
  const { state } = useSidebar()
  const { label, checkoutCtaLabel, isPending } = useLiveEntitlementStanding()
  const { startCheckout, isStarting } = useSubscriptionCheckout()
  const collapsed = state === 'collapsed'
  const display = isPending ? '…' : label
  const showCheckoutCta = !isPending && checkoutCtaLabel != null

  return (
    <SidebarMenu>
      {showCheckoutCta ? (
        <SidebarMenuItem>
          <SidebarMenuButton
            className='text-base'
            tooltip={checkoutCtaLabel}
            disabled={isStarting}
            onClick={startCheckout}
          >
            <CreditCard />
            {!collapsed && <span>{checkoutCtaLabel}</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : null}
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
    </SidebarMenu>
  )
}
