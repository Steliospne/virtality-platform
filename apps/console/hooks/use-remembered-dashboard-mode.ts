'use client'
import { useCell, useStore } from 'tinybase/ui-react'
import { parseDashboardMode } from '@/lib/dashboard-mode'
import type { DashboardMode } from '@/types/models'

/**
 * Per-patient memory of the last dashboard mode, kept on the patient's row in
 * the TinyBase `patients` table next to the last program, avatar and map.
 */
export function useRememberedDashboardMode(patientId: string) {
  const store = useStore()
  const rememberedMode = parseDashboardMode(
    useCell('patients', patientId, 'lastDashboardMode'),
  )

  const rememberMode = (mode: DashboardMode) => {
    if (!patientId) return
    store?.setCell('patients', patientId, 'lastDashboardMode', mode)
  }

  return { rememberedMode, rememberMode }
}
