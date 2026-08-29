'use client'

/**
 * Soft-unavailable banner when Discount terms cannot be shown.
 */

import { BILLING_SOFT_UNAVAILABLE_COPY } from '@/lib/profile-billing'

export function BillingSoftUnavailableBanner() {
  return (
    <p className='rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900'>
      {BILLING_SOFT_UNAVAILABLE_COPY}
    </p>
  )
}
