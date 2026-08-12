'use client'

import { useCallback, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Building, CreditCard, Key, UserIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBillingFeatureEnabled } from '@/hooks/use-billing-feature'

type ProfileTab = 'info' | 'billing' | 'organizations' | 'sessions'

type ProfileTabsProps = {
  info: ReactNode
  billing: ReactNode
  sessions: ReactNode
}

/**
 * Profile tabs with `?tab=` deep links (Billing CTA from sidebar / renew banner).
 * Billing is gated by PostHog `billing_feature` (virtality.app only).
 */
export function ProfileTabs({ info, billing, sessions }: ProfileTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const billingEnabled = useBillingFeatureEnabled()

  const requested = searchParams.get('tab')
  let activeTab: ProfileTab = 'info'
  if (requested === 'billing' && billingEnabled) {
    activeTab = 'billing'
  } else if (
    requested === 'organizations' ||
    requested === 'sessions' ||
    requested === 'info'
  ) {
    activeTab = requested
  }

  const onTabChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === 'info') {
        params.delete('tab')
      } else {
        params.set('tab', next)
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams],
  )

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className='w-full gap-2'>
        <TabsTrigger value='info'>
          <UserIcon />
          Info
        </TabsTrigger>
        {billingEnabled ? (
          <TabsTrigger value='billing'>
            <CreditCard />
            Billing
          </TabsTrigger>
        ) : null}
        <TabsTrigger value='organizations'>
          <Building />
        </TabsTrigger>
        <TabsTrigger value='sessions'>
          <Key />
          Sessions
        </TabsTrigger>
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
