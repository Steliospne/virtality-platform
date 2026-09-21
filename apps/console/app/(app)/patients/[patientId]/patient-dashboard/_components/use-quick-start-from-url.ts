'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { usePatientDashboard } from '@/context/patient-dashboard-context'

export const QUICK_START_QUERY_PARAM = 'quickstart'

/**
 * `?quickstart=1` (set by the home dashboard's Start a session picker) opens
 * the Quick Start dialog once, then drops the param so a refresh does not
 * reopen it.
 */
export function useQuickStartFromUrl() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const {
    handler: { setInQuickStart },
  } = usePatientDashboard()

  const requested = searchParams.get(QUICK_START_QUERY_PARAM) === '1'

  useEffect(() => {
    if (!requested) return
    setInQuickStart(true)
    router.replace(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested, pathname])
}
