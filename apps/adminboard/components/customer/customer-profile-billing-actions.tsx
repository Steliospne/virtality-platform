'use client'

import { CustomerProfileAssignFreeBillingDialog } from '@/components/customer/customer-profile-assign-free-billing-dialog'
import { CustomerProfileCancelCyclePlanChangeDialog } from '@/components/customer/customer-profile-cancel-cycle-plan-change-dialog'
import { CustomerProfileCancelSubscriptionDialog } from '@/components/customer/customer-profile-cancel-subscription-dialog'
import { CustomerProfileChangePaidPlanDialog } from '@/components/customer/customer-profile-change-paid-plan-dialog'
import { CustomerProfileReactivateSubscriptionDialog } from '@/components/customer/customer-profile-reactivate-subscription-dialog'
import { CustomerProfileSection } from '@/components/customer/customer-profile-section'
import { Button } from '@/components/ui/button'
import {
  canAssignFreeAfterCancellation,
  canCancelCyclePlanChange,
  canCancelPaidBilling,
  canChangePaidPlan,
  canReactivatePaidBilling,
} from '@/lib/admin-customer-actions'
import type { AdminCustomerProfile } from '@virtality/shared/utils'
import { useState } from 'react'

type CustomerProfileBillingActionsProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileBillingActions({
  profile,
}: CustomerProfileBillingActionsProps) {
  const [changePlanOpen, setChangePlanOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [cancelCycleOpen, setCancelCycleOpen] = useState(false)
  const [assignFreeOpen, setAssignFreeOpen] = useState(false)

  const canChangePlan = canChangePaidPlan(profile)
  const canCancel = canCancelPaidBilling(profile)
  const canReactivate = canReactivatePaidBilling(profile)
  const canCancelCycle = canCancelCyclePlanChange(profile)
  const canAssignFree = canAssignFreeAfterCancellation(profile)

  if (
    !canChangePlan &&
    !canCancel &&
    !canReactivate &&
    !canCancelCycle &&
    !canAssignFree
  ) {
    return (
      <CustomerProfileSection title='Billing administration'>
        <p className='text-muted-foreground text-sm'>
          Paid-plan administration is unavailable for this customer state.
        </p>
      </CustomerProfileSection>
    )
  }

  return (
    <>
      <CustomerProfileSection title='Billing administration'>
        <p className='text-muted-foreground mb-4 text-sm'>
          Change paid Default intervals, cancel or reactivate subscriptions,
          release a queued Cycle plan change, assign Free after cancellation, or
          send Checkout links when no payment method exists. Each action
          requires a reason, confirmation, and audit record. Results stay
          pending until Stripe webhook sync settles the profile.
        </p>
        <div className='flex flex-wrap gap-3'>
          {canChangePlan ? (
            <Button variant='outline' onClick={() => setChangePlanOpen(true)}>
              Change paid plan
            </Button>
          ) : null}
          {canCancel ? (
            <Button variant='outline' onClick={() => setCancelOpen(true)}>
              Cancel subscription
            </Button>
          ) : null}
          {canReactivate ? (
            <Button onClick={() => setReactivateOpen(true)}>
              Reactivate subscription
            </Button>
          ) : null}
          {canCancelCycle ? (
            <Button variant='outline' onClick={() => setCancelCycleOpen(true)}>
              Cancel Cycle plan change
            </Button>
          ) : null}
          {canAssignFree ? (
            <Button variant='secondary' onClick={() => setAssignFreeOpen(true)}>
              Assign Free after cancellation
            </Button>
          ) : null}
        </div>
      </CustomerProfileSection>

      {canChangePlan ? (
        <CustomerProfileChangePaidPlanDialog
          userId={profile.userId}
          open={changePlanOpen}
          onOpenChange={setChangePlanOpen}
        />
      ) : null}
      {canCancel ? (
        <CustomerProfileCancelSubscriptionDialog
          profile={profile}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
        />
      ) : null}
      {canReactivate ? (
        <CustomerProfileReactivateSubscriptionDialog
          profile={profile}
          open={reactivateOpen}
          onOpenChange={setReactivateOpen}
        />
      ) : null}
      {canCancelCycle ? (
        <CustomerProfileCancelCyclePlanChangeDialog
          profile={profile}
          open={cancelCycleOpen}
          onOpenChange={setCancelCycleOpen}
        />
      ) : null}
      {canAssignFree ? (
        <CustomerProfileAssignFreeBillingDialog
          userId={profile.userId}
          open={assignFreeOpen}
          onOpenChange={setAssignFreeOpen}
        />
      ) : null}
    </>
  )
}
