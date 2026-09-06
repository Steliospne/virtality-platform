'use client'

import { CustomerProfileAssignPermanentAccessGateDialog } from '@/components/customer/customer-profile-assign-permanent-access-gate-dialog'
import { CustomerProfileRevokeAccessGateDialog } from '@/components/customer/customer-profile-revoke-access-gate-dialog'
import { CustomerProfileSection } from '@/components/customer/customer-profile-section'
import { CustomerProfileSetAccessGateTrialDialog } from '@/components/customer/customer-profile-set-access-gate-trial-dialog'
import { Button } from '@/components/ui/button'
import {
  canAssignPermanentAccessGate,
  canRevokeAccessGate,
  canSetAccessGateTrial,
  isAccessGateStaffActionsBlocked,
  setAccessGateTrialActionLabel,
} from '@/lib/access-gate-actions'
import { formatAccessGrantStatusSummary } from '@/lib/access-grant-display'
import type { AdminCustomerProfile } from '@virtality/shared/utils'
import { useState } from 'react'

type CustomerProfileAccessGateProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileAccessGate({
  profile,
}: CustomerProfileAccessGateProps) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [trialOpen, setTrialOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)

  const canAssign = canAssignPermanentAccessGate(profile)
  const canSetTrial = canSetAccessGateTrial(profile)
  const canRevoke = canRevokeAccessGate(profile)
  const hasActions = canAssign || canSetTrial || canRevoke
  const blocked = isAccessGateStaffActionsBlocked(profile)
  const testerRecipient = profile.role === 'tester'

  return (
    <>
      <CustomerProfileSection title='Access Gate'>
        <p className='text-muted-foreground mb-4 text-sm'>
          Manage the customer&apos;s Access Gate without Stripe calls. Assign
          permanent access for bookkeeping only, issue or extend timed trial
          access, or revoke the open gate. Each action requires a reason and
          audit record.
        </p>

        {profile.accessGrant ? (
          <p className='mb-4 text-sm font-medium'>
            {formatAccessGrantStatusSummary(profile.accessGrant)}
          </p>
        ) : (
          <p className='text-muted-foreground mb-4 text-sm'>
            No Access Gate on record.
          </p>
        )}

        {hasActions ? (
          <div className='flex flex-wrap gap-3'>
            {canAssign ? (
              <Button variant='outline' onClick={() => setAssignOpen(true)}>
                Assign permanent Access Gate
              </Button>
            ) : null}
            {canSetTrial ? (
              <Button onClick={() => setTrialOpen(true)}>
                {setAccessGateTrialActionLabel(profile)}
              </Button>
            ) : null}
            {canRevoke ? (
              <Button variant='destructive' onClick={() => setRevokeOpen(true)}>
                Revoke Access Gate
              </Button>
            ) : null}
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>
            {blocked
              ? 'Access Gate actions are unavailable after conversion to paid.'
              : 'Access Gate actions are unavailable for this customer state.'}
          </p>
        )}
      </CustomerProfileSection>

      {canAssign ? (
        <CustomerProfileAssignPermanentAccessGateDialog
          userId={profile.userId}
          open={assignOpen}
          onOpenChange={setAssignOpen}
          testerRecipient={testerRecipient}
        />
      ) : null}
      {canSetTrial ? (
        <CustomerProfileSetAccessGateTrialDialog
          userId={profile.userId}
          profile={profile}
          open={trialOpen}
          onOpenChange={setTrialOpen}
        />
      ) : null}
      {canRevoke ? (
        <CustomerProfileRevokeAccessGateDialog
          userId={profile.userId}
          open={revokeOpen}
          onOpenChange={setRevokeOpen}
        />
      ) : null}
    </>
  )
}
