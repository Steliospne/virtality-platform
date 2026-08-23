'use client'

import { CustomerProfileDialog } from '@/components/customer/customer-profile-dialog'
import { CustomerTable } from '@/components/customer/customer-table'
import type { AdminCustomerListItem } from '@virtality/shared/utils'
import { useCallback, useState } from 'react'

export function CustomerWorkspace() {
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleViewProfile = useCallback((customer: AdminCustomerListItem) => {
    setProfileUserId(customer.userId)
    setProfileOpen(true)
  }, [])

  return (
    <div className='p-8'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold tracking-tight'>Customers</h1>
        <p className='text-muted-foreground mt-2 max-w-3xl'>
          Every non-deleted Console user with separate Access and Billing
          status. Open a row menu to review identity, Entitlement Clock,
          subscription history, and Stripe links.
        </p>
      </div>

      <CustomerTable onViewProfile={handleViewProfile} />
      <CustomerProfileDialog
        userId={profileUserId}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  )
}
