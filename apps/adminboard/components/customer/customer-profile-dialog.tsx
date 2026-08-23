'use client'

import { CustomerProfileActions } from '@/components/customer/customer-profile-actions'
import { CustomerProfileBillingActions } from '@/components/customer/customer-profile-billing-actions'
import { CustomerProfileAuditHistory } from '@/components/customer/customer-profile-audit-history'
import { CustomerProfileIdentity } from '@/components/customer/customer-profile-identity'
import { CustomerProfileStatus } from '@/components/customer/customer-profile-status'
import { CustomerProfileStripeLinks } from '@/components/customer/customer-profile-stripe-links'
import { CustomerProfileSubscriptions } from '@/components/customer/customer-profile-subscriptions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdminCustomerProfile } from '@virtality/react-query'

type CustomerProfileDialogProps = {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileDialog({
  userId,
  open,
  onOpenChange,
}: CustomerProfileDialogProps) {
  const { data: profile, isPending, isError } = useAdminCustomerProfile(userId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] max-w-3xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Customer profile</DialogTitle>
          <DialogDescription>
            Identity, Entitlement Clock, subscription history, access grants,
            billing administration, audit trail, and Stripe links.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <p className='text-muted-foreground text-sm'>Loading profile...</p>
        ) : null}
        {isError ? (
          <p className='text-destructive text-sm'>
            Failed to load customer profile.
          </p>
        ) : null}
        {profile ? (
          <div className='grid gap-6'>
            <CustomerProfileIdentity profile={profile} />
            <CustomerProfileStatus profile={profile} />
            <CustomerProfileActions profile={profile} />
            <CustomerProfileBillingActions profile={profile} />
            <CustomerProfileSubscriptions profile={profile} />
            <CustomerProfileAuditHistory profile={profile} />
            <CustomerProfileStripeLinks profile={profile} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
