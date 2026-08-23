'use client'

import { CustomerProfileAssignFreeDialog } from '@/components/customer/customer-profile-assign-free-dialog'
import { CustomerProfileGrantTrialDialog } from '@/components/customer/customer-profile-grant-trial-dialog'
import { CustomerProfileSection } from '@/components/customer/customer-profile-section'
import { Button } from '@/components/ui/button'
import { canAssignCustomerAccessGrant } from '@/lib/admin-customer-actions'
import type { AdminCustomerProfile } from '@virtality/shared/utils'
import { useState } from 'react'

type CustomerProfileActionsProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileActions({
  profile,
}: CustomerProfileActionsProps) {
  const [assignFreeOpen, setAssignFreeOpen] = useState(false)
  const [grantTrialOpen, setGrantTrialOpen] = useState(false)
  const canAssign = canAssignCustomerAccessGrant(profile)
  const testerRecipient = profile.role === 'tester'

  if (!canAssign) {
    return (
      <CustomerProfileSection title='Access grants'>
        <p className='text-muted-foreground text-sm'>
          Permanent Free and timed trial grants are available when the customer
          does not already have a live paid or trialing subscription.
        </p>
      </CustomerProfileSection>
    )
  }

  return (
    <>
      <CustomerProfileSection title='Access grants'>
        <p className='text-muted-foreground mb-4 text-sm'>
          Assign permanent Free or grant a timed no-card trial. Each action
          requires a reason, confirmation, and audit record.
          {testerRecipient
            ? ' Tester recipients become standard users when granted.'
            : null}
        </p>
        <div className='flex flex-wrap gap-3'>
          <Button variant='outline' onClick={() => setAssignFreeOpen(true)}>
            Assign permanent Free
          </Button>
          <Button onClick={() => setGrantTrialOpen(true)}>
            Grant timed trial
          </Button>
        </div>
      </CustomerProfileSection>

      <CustomerProfileAssignFreeDialog
        userId={profile.userId}
        open={assignFreeOpen}
        onOpenChange={setAssignFreeOpen}
        testerRecipient={testerRecipient}
      />
      <CustomerProfileGrantTrialDialog
        userId={profile.userId}
        open={grantTrialOpen}
        onOpenChange={setGrantTrialOpen}
        testerRecipient={testerRecipient}
      />
    </>
  )
}
