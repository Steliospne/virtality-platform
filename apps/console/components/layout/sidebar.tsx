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
  SidebarMenuSkeleton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import sidebarLinks from '@/data/static/sidebar-links'
import Link from 'next/link'
import SmallLogo from './sm-logo'
import { BugReportForm } from '../ui/bug-report-form'
import { Flag, Sidebar as SidebarIcon } from 'lucide-react'
import useMounted from '@/hooks/use-mounted'
import { cn } from '@/lib/utils'
import useIsAuthed from '@/hooks/use-is-authed'

const RootSidebar = () => {
  const { isMobile, open } = useSidebar()
  const { data, isPending } = useIsAuthed()
  const mounted = useMounted()

  if (!data) return null

  // Show loading state until mounted and session is loaded
  const isLoading = !mounted || isPending

  if (isLoading) {
    return (
      <aside className={cn('bg-sidebar w-12', open && 'w-64')}>
        <SidebarMenuSkeleton
          showIcon
          className={cn(
            'bg-sidebar-accent *:bg-accent-foreground h-[60px] w-full',
            !open &&
              'justify-center **:data-[sidebar="menu-skeleton-text"]:hidden',
          )}
        />

        {[0, 1, 2, 3].map((index) => (
          <SidebarMenuSkeleton
            key={index}
            showIcon
            className={cn(
              'bg-sidebar-accent *:bg-accent-foreground w-full',
              !open &&
                'justify-center **:data-[sidebar="menu-skeleton-text"]:hidden',
            )}
          />
        ))}
      </aside>
    )
  }

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='flex h-[60px] justify-center gap-2 rounded-none border-b border-zinc-200'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              {isMobile ? (
                <SidebarTrigger className='justify-end'>
                  <SidebarIcon />
                </SidebarTrigger>
              ) : (
                <Link href='/'>
                  <SmallLogo className='size-4' />
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
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
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
      <SidebarFooter className='mt-auto'></SidebarFooter>
    </Sidebar>
  )
}

export default RootSidebar
