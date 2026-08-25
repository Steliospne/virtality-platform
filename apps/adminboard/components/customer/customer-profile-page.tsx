'use client'

import { CustomerProfileActions } from '@/components/customer/customer-profile-actions'
import { CustomerProfileAuditTrail } from '@/components/customer/customer-profile-audit-trail'
import { CustomerProfileBillingActions } from '@/components/customer/customer-profile-billing-actions'
import { CustomerProfileRail } from '@/components/customer/customer-profile-rail'
import { CustomerProfileSubscriptions } from '@/components/customer/customer-profile-subscriptions'
import { Button } from '@/components/ui/button'
import { useAdminCustomerProfile } from '@virtality/react-query'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type CustomerProfilePageProps = {
  userId: string
}

export function CustomerProfilePage({ userId }: CustomerProfilePageProps) {
  const { data: profile, isPending, isError } = useAdminCustomerProfile(userId)

  if (isPending) {
    return (
      <div className='text-muted-foreground p-8 text-sm'>
        Loading customer profile...
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className='space-y-4 p-8'>
        <Button asChild variant='ghost' size='sm' className='-ml-2 w-fit'>
          <Link href='/customers'>
            <ArrowLeft className='size-4' />
            Customers
          </Link>
        </Button>
        <p className='text-destructive text-sm'>
          Failed to load customer profile.
        </p>
      </div>
    )
  }

  return (
    <div className='flex min-h-[calc(100svh-4rem)] flex-col lg:flex-row'>
      <CustomerProfileRail profile={profile} />
      <main className='min-w-0 flex-1 space-y-10 p-6 lg:p-10'>
        <CustomerProfileActions profile={profile} />
        <CustomerProfileBillingActions profile={profile} />
        <CustomerProfileSubscriptions profile={profile} />
        <CustomerProfileAuditTrail profile={profile} />
      </main>
    </div>
  )
}
