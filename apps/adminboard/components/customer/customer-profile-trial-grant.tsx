'use client'

import { CustomerProfileAdjustTrialGrantDialog } from '@/components/customer/customer-profile-adjust-trial-grant-dialog'
import { CustomerProfileIssueTrialGrantDialog } from '@/components/customer/customer-profile-issue-trial-grant-dialog'
import { CustomerProfileRevokeTrialGrantDialog } from '@/components/customer/customer-profile-revoke-trial-grant-dialog'
import { CustomerProfileSection } from '@/components/customer/customer-profile-section'
import { CustomerProfileStartTrialGrantDialog } from '@/components/customer/customer-profile-start-trial-grant-dialog'
import { Button } from '@/components/ui/button'
import {
  canAdjustTrialGrant,
  canIssueTrialGrant,
  canRevokeTrialGrant,
  canStartTrialGrant,
} from '@/lib/trial-grant-actions'
import { formatTrialGrantStatusSummary } from '@/lib/trial-grant-display'
import type { AdminCustomerProfile } from '@virtality/shared/utils'
import { useState } from 'react'

type CustomerProfileTrialGrantProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileTrialGrant({
  profile,
}: CustomerProfileTrialGrantProps) {
  const [issueOpen, setIssueOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)

  const canIssue = canIssueTrialGrant(profile)
  const canStart = canStartTrialGrant(profile)
  const canAdjust = canAdjustTrialGrant(profile)
  const canRevoke = canRevokeTrialGrant(profile)
  const hasActions = canIssue || canStart || canAdjust || canRevoke

  return (
    <>
      <CustomerProfileSection title='Owned trial grant'>
        <p className='text-muted-foreground mb-4 text-sm'>
          Manage the free-product-code trial lifecycle without Stripe calls.
          Issue a pending grant, start it after onboarding, then extend, reduce,
          or revoke as needed. Each action requires a reason and audit record.
        </p>

        {profile.trialGrant ? (
          <p className='mb-4 text-sm font-medium'>
            {formatTrialGrantStatusSummary(profile.trialGrant)}
          </p>
        ) : (
          <p className='text-muted-foreground mb-4 text-sm'>
            No trial grant on record.
          </p>
        )}

        {hasActions ? (
          <div className='flex flex-wrap gap-3'>
            {canIssue ? (
              <Button onClick={() => setIssueOpen(true)}>Issue grant</Button>
            ) : null}
            {canStart ? (
              <Button onClick={() => setStartOpen(true)}>Start trial</Button>
            ) : null}
            {canAdjust ? (
              <Button variant='outline' onClick={() => setAdjustOpen(true)}>
                Extend or reduce
              </Button>
            ) : null}
            {canRevoke ? (
              <Button variant='destructive' onClick={() => setRevokeOpen(true)}>
                Revoke grant
              </Button>
            ) : null}
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>
            Trial grant actions are unavailable for this customer state.
          </p>
        )}
      </CustomerProfileSection>

      {canIssue ? (
        <CustomerProfileIssueTrialGrantDialog
          userId={profile.userId}
          open={issueOpen}
          onOpenChange={setIssueOpen}
        />
      ) : null}
      {canStart ? (
        <CustomerProfileStartTrialGrantDialog
          userId={profile.userId}
          open={startOpen}
          onOpenChange={setStartOpen}
        />
      ) : null}
      {canAdjust ? (
        <CustomerProfileAdjustTrialGrantDialog
          userId={profile.userId}
          open={adjustOpen}
          onOpenChange={setAdjustOpen}
        />
      ) : null}
      {canRevoke ? (
        <CustomerProfileRevokeTrialGrantDialog
          userId={profile.userId}
          open={revokeOpen}
          onOpenChange={setRevokeOpen}
        />
      ) : null}
    </>
  )
}
