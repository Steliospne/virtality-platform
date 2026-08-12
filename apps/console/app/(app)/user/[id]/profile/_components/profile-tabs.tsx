'use client'

import { useCallback, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Building, CreditCard, Key, UserIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type ProfileTab = 'info' | 'billing' | 'organizations' | 'sessions'

type ProfileTabsProps = {
  info: ReactNode
  billing: ReactNode
  sessions: ReactNode
}

/**
 * Profile tabs with `?tab=` deep links (Billing CTA from sidebar / renew banner).
 */
export function ProfileTabs({ info, billing, sessions }: ProfileTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const requested = searchParams.get('tab')
  let activeTab: ProfileTab = 'info'
  if (requested === 'billing') {
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
        <TabsTrigger value='billing'>
          <CreditCard />
          Billing
        </TabsTrigger>
        <TabsTrigger value='organizations'>
          <Building />
        </TabsTrigger>
        <TabsTrigger value='sessions'>
          <Key />
          Sessions
        </TabsTrigger>
      </TabsList>
      <TabsContent value='info'>{info}</TabsContent>
      <TabsContent value='billing'>{billing}</TabsContent>
      <TabsContent value='organizations'>Organizations</TabsContent>
      <TabsContent value='sessions'>{sessions}</TabsContent>
    </Tabs>
  )
}
