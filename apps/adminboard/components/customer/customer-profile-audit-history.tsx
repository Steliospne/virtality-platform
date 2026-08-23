'use client'

import { CustomerProfileSection } from '@/components/customer/customer-profile-section'
import {
  formatAuditActionLabel,
  formatBillingSnapshotSummary,
} from '@/lib/admin-customer-actions'
import { formatCustomerSubscriptionDate } from '@/lib/admin-customer-display'
import type { AdminCustomerProfile } from '@virtality/shared/utils'

type CustomerProfileAuditHistoryProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileAuditHistory({
  profile,
}: CustomerProfileAuditHistoryProps) {
  if (profile.auditHistory.length === 0) {
    return (
      <CustomerProfileSection title='Audit history'>
        <p className='text-muted-foreground text-sm'>
          No billing mutations recorded yet.
        </p>
      </CustomerProfileSection>
    )
  }

  return (
    <CustomerProfileSection title='Audit history'>
      <div className='space-y-4'>
        {profile.auditHistory.map((entry) => (
          <div key={entry.id} className='rounded-lg border p-4 text-sm'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <p className='font-medium'>
                {formatAuditActionLabel(entry.action)}
              </p>
              <p className='text-muted-foreground'>
                {formatCustomerSubscriptionDate(entry.createdAt)}
              </p>
            </div>
            <p className='text-muted-foreground mt-1'>
              {entry.actorName} ({entry.actorEmail})
            </p>
            <p className='mt-2'>Reason: {entry.reason}</p>
            <p className='text-muted-foreground mt-1'>
              Outcome: {entry.outcome}
              {entry.stripeOperationId
                ? ` · Stripe ${entry.stripeOperationId}`
                : null}
            </p>
            <p className='text-muted-foreground mt-2'>
              Before: {formatBillingSnapshotSummary(entry.beforeBillingState)}
            </p>
            <p className='text-muted-foreground'>
              After: {formatBillingSnapshotSummary(entry.afterBillingState)}
            </p>
          </div>
        ))}
      </div>
    </CustomerProfileSection>
  )
}
