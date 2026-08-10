'use client'

import { Clock } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'

/**
 * Always-visible Remaining Time from the Entitlement Clock.
 * Shows "Expired" when not entitled; remaining time never goes negative.
 */
export function RemainingTimeSidebar() {
  const { state } = useSidebar()
  const { label, isPending } = useLiveEntitlementStanding()
  const collapsed = state === 'collapsed'
  const display = isPending ? '…' : label

  return (
    <SidebarMenu>
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
