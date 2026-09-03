'use client'

import { CustomerProfileAssignVariantDialog } from '@/components/customer/customer-profile-assign-variant-dialog'
import { CustomerProfileSection } from '@/components/customer/customer-profile-section'
import { Button } from '@/components/ui/button'
import {
  ASSIGN_PLAN_VARIANT_LIVE_PAID_BLOCK_MESSAGE,
  humanizePlanVariantName,
  type AdminCustomerProfile,
} from '@virtality/shared/utils'
import { useState } from 'react'

type CustomerProfileAssignedVariantProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileAssignedVariant({
  profile,
}: CustomerProfileAssignedVariantProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const canChange = profile.canChangeAssignedPlanVariant
  const label = humanizePlanVariantName(profile.assignedDefaultVariant)

  return (
    <>
      <CustomerProfileSection title='Assigned Variant'>
        <p className='text-muted-foreground mb-4 text-sm'>
          Staff-assigned Default list price pair. Clinicians never see the
          variant name; Console Billing and Checkout use this pair.
        </p>
        <div className='flex flex-wrap items-center gap-3'>
          <p className='text-sm'>
            <span className='text-muted-foreground'>Current: </span>
            <span className='font-medium'>{label}</span>
            <span className='text-muted-foreground ml-2 font-mono text-xs'>
              {profile.assignedDefaultVariant}
            </span>
          </p>
          <Button
            variant='outline'
            size='sm'
            disabled={!canChange}
            title={
              canChange
                ? undefined
                : ASSIGN_PLAN_VARIANT_LIVE_PAID_BLOCK_MESSAGE
            }
            onClick={() => setDialogOpen(true)}
          >
            Change Assigned Variant
          </Button>
        </div>
        {!canChange ? (
          <p className='text-muted-foreground mt-2 text-xs'>
            {ASSIGN_PLAN_VARIANT_LIVE_PAID_BLOCK_MESSAGE}
          </p>
        ) : null}
      </CustomerProfileSection>

      <CustomerProfileAssignVariantDialog
        userId={profile.userId}
        currentVariant={profile.assignedDefaultVariant}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
