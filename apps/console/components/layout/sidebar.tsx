'use client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import sidebarLinks from '@/data/static/sidebar-links'
import Link from 'next/link'
import SmallLogo from './sm-logo'
import { BugReportForm } from '../ui/bug-report-form'
import { Flag, Sidebar as SidebarIcon } from 'lucide-react'
import {
  AnalyticsEventProps,
  trackAnalyticsEvent,
} from '@/lib/analytics-contract'
import { RemainingTimeSidebar } from './remaining-time-sidebar'

const RootSidebar = () => {
  const { isMobile } = useSidebar()

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='flex h-15 justify-center gap-2 rounded-none border-b border-zinc-200'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              {isMobile ? (
                <SidebarTrigger className='justify-end'>
                  <SidebarIcon />
                </SidebarTrigger>
              ) : (
                <Link href='/'>
                  <SmallLogo className='size-6' />
                  <span>Virtality</span>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sidebarLinks.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className='text-base'
                  tooltip={item.title}
                  onClick={() => {
                    trackAnalyticsEvent('nav_item_clicked', {
                      item: item.title as AnalyticsEventProps<'nav_item_clicked'>['item'],
                    })
                  }}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span className='capitalize'>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <BugReportForm>
                <SidebarMenuButton
                  className='cursor-pointer text-base'
                  tooltip={'Report Problem'}
                >
                  <Flag />
                  <span>Report Problem</span>
                </SidebarMenuButton>
              </BugReportForm>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      {/* Lift footer when collapsed so lower nav tooltips clear Remaining Time */}
      <SidebarFooter className='mt-auto mb-6 border-t border-zinc-200 group-data-[collapsible=icon]:-translate-y-2'>
        <RemainingTimeSidebar />
      </SidebarFooter>
    </Sidebar>
  )
}

export default RootSidebar
