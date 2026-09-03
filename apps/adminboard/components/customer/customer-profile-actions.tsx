'use client'

import { CustomerProfileAssignFreeDialog } from '@/components/customer/customer-profile-assign-free-dialog'
import { CustomerProfileSection } from '@/components/customer/customer-profile-section'
import { Button } from '@/components/ui/button'
import { canAssignCustomerAccessGrant } from '@/lib/admin-customer-actions'
import type { AdminCustomerProfile } from '@virtality/shared/utils'
import { useState } from 'react'

const TRIAL_GRANT_SECTION_NOTE =
  'Trial grants are managed in the Owned trial grant section.'

type CustomerProfileActionsProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileActions({
  profile,
}: CustomerProfileActionsProps) {
  const [assignFreeOpen, setAssignFreeOpen] = useState(false)
  const canAssign = canAssignCustomerAccessGrant(profile)
  const testerRecipient = profile.role === 'tester'

  return (
    <>
      <CustomerProfileSection title='Access grants'>
        <p className='text-muted-foreground mb-4 text-sm'>
          {canAssign ? (
            <>
              Assign permanent Free when the customer should have ongoing access
              without a trial clock. Requires a reason, confirmation, and audit
              record.
              {testerRecipient
                ? ' Tester recipients become standard users when granted.'
                : null}
            </>
          ) : (
            <>
              Permanent Free is available when the customer does not already
              have a live paid or trialing subscription.
            </>
          )}{' '}
          {TRIAL_GRANT_SECTION_NOTE}
        </p>
        {canAssign ? (
          <div className='flex flex-wrap gap-3'>
            <Button variant='outline' onClick={() => setAssignFreeOpen(true)}>
              Assign permanent Free
            </Button>
          </div>
        ) : null}
      </CustomerProfileSection>

      {canAssign ? (
        <CustomerProfileAssignFreeDialog
          userId={profile.userId}
          open={assignFreeOpen}
          onOpenChange={setAssignFreeOpen}
          testerRecipient={testerRecipient}
        />
      ) : null}
    </>
  )
}
