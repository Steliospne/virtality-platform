'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building, CreditCard, Key, UserIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBillingFeatureEnabled } from '@/hooks/use-billing-feature'
import {
  profileTabHref,
  resolveProfileTab,
  type ProfileTab,
} from '@/lib/profile-tab-navigation'

type ProfileTabsProps = {
  requestedTab?: string
  info: ReactNode
  billing: ReactNode
  sessions: ReactNode
}

function ProfileTabLink({
  tab,
  pathname,
  children,
}: {
  tab: ProfileTab
  pathname: string
  children: ReactNode
}) {
  return (
    <TabsTrigger value={tab} asChild>
      <Link href={profileTabHref(pathname, tab)} scroll={false}>
        {children}
      </Link>
    </TabsTrigger>
  )
}

/**
 * Profile tabs with `?tab=` deep links (Billing CTA from sidebar / renew banner).
 * Billing is gated by PostHog `billing_feature` (virtality.app only).
 */
export function ProfileTabs({
  requestedTab,
  info,
  billing,
  sessions,
}: ProfileTabsProps) {
  const pathname = usePathname()
  const billingEnabled = useBillingFeatureEnabled()
  const activeTab = resolveProfileTab(requestedTab, billingEnabled)

  return (
    <Tabs value={activeTab}>
      <TabsList className='w-full gap-2'>
        <ProfileTabLink tab='info' pathname={pathname}>
          <UserIcon />
          Info
        </ProfileTabLink>
        {billingEnabled ? (
          <ProfileTabLink tab='billing' pathname={pathname}>
            <CreditCard />
            Billing
          </ProfileTabLink>
        ) : null}
        <ProfileTabLink tab='organizations' pathname={pathname}>
          <Building />
          Organizations
        </ProfileTabLink>
        <ProfileTabLink tab='sessions' pathname={pathname}>
          <Key />
          Sessions
        </ProfileTabLink>
      </TabsList>
      <TabsContent value='info'>{info}</TabsContent>
      {billingEnabled ? (
        <TabsContent value='billing'>{billing}</TabsContent>
      ) : null}
      <TabsContent value='organizations'>Organizations</TabsContent>
      <TabsContent value='sessions'>{sessions}</TabsContent>
    </Tabs>
  )
}
