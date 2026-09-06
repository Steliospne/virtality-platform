'use client'

import { AlertTriangle } from 'lucide-react'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'
import { TREATMENT_LAUNCH_ERROR } from '@/lib/patient-dashboard-treatment-launch'

/**
 * Blocking notice shown when the Entitlement Clock has expired, so the
 * clinician knows why the VR program can't be launched before they try.
 */
export function VrAccessExpiredBanner() {
  const { canLaunchVr } = useLiveEntitlementStanding()

  if (canLaunchVr) return null

  return (
    <div
      role='status'
      className='flex items-start gap-3 rounded-lg border border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 px-4 py-3 dark:border-amber-900/50 dark:from-amber-950/50 dark:via-orange-950/30 dark:to-amber-950/40'
    >
      <div className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-900/60 dark:text-amber-100 dark:ring-amber-800/60'>
        <AlertTriangle className='size-4' aria-hidden />
      </div>

      <div className='min-w-0 flex-1'>
        <p className='text-sm font-semibold text-amber-950 dark:text-amber-50'>
          VR program unavailable
        </p>
        <p className='mt-0.5 text-sm text-amber-900/75 dark:text-amber-100/70'>
          {TREATMENT_LAUNCH_ERROR.entitlementExpired}
        </p>
      </div>
    </div>
  )
}
