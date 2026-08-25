'use client'

import {
  formatAuditActionLabel,
  formatBillingSnapshotSummary,
} from '@/lib/admin-customer-actions'
import { formatCustomerSubscriptionDate } from '@/lib/admin-customer-display'
import type { AdminCustomerProfile } from '@virtality/shared/utils'

type CustomerProfileAuditTrailProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileAuditTrail({
  profile,
}: CustomerProfileAuditTrailProps) {
  return (
    <section className='space-y-4'>
      <h2 className='text-lg font-semibold'>Audit trail</h2>
      {profile.auditHistory.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          No billing mutations recorded yet.
        </p>
      ) : (
        <ol className='relative space-y-0 border-l pl-6'>
          {profile.auditHistory.map((entry) => (
            <li key={entry.id} className='relative pb-8 last:pb-0'>
              <span className='absolute top-1.5 -left-[1.55rem] size-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100' />
              <p className='font-medium'>
                {formatAuditActionLabel(entry.action)}
              </p>
              <p className='text-muted-foreground text-sm'>
                {formatCustomerSubscriptionDate(entry.createdAt)} ·{' '}
                {entry.actorName}
              </p>
              <p className='mt-2 text-sm'>{entry.reason}</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Outcome: {entry.outcome}
                {entry.stripeOperationId
                  ? ` · Stripe ${entry.stripeOperationId}`
                  : null}
              </p>
              <p className='text-muted-foreground mt-2 text-xs'>
                {formatBillingSnapshotSummary(entry.beforeBillingState)} →{' '}
                {formatBillingSnapshotSummary(entry.afterBillingState)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
