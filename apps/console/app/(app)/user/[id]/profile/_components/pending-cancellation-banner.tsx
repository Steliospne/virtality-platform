'use client'

/**
 * Warning notice while cancel-at-period-end is scheduled on the live Pro seat.
 */

export function PendingCancellationBanner({ message }: { message: string }) {
  return (
    <div className='rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100'>
      {message}
    </div>
  )
}
