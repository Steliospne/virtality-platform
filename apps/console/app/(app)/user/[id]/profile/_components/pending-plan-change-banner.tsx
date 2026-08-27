'use client'

/**
 * Persistent notice while a period-end Pro interval switch is scheduled.
 */

export function PendingPlanChangeBanner({ message }: { message: string }) {
  return (
    <div className='border-vital-blue-200 bg-vital-blue-50 text-vital-blue-950 dark:border-vital-blue-900 dark:bg-vital-blue-950/40 dark:text-vital-blue-100 rounded-lg border px-3 py-2 text-sm'>
      {message}
    </div>
  )
}
