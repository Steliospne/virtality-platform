'use client'

import { useMemo } from 'react'
import {
  usePatients,
  useRecentPatientSessions,
  useReusablePrograms,
} from '@virtality/react-query'
import { useDeviceContext } from '@/context/device-context'
import { useVrPresencePolling } from '@/hooks/use-vr-presence-polling'
import {
  buildHomeSessionsSummary,
  homeFetchSince,
} from '@/lib/home-sessions-summary'
import { buildGettingStarted } from '@/lib/home-getting-started'

export type HomeDashboardData = ReturnType<typeof useHomeDashboardData>

/** Everything the home dashboard cards read, fetched once and shared. */
export function useHomeDashboardData(now: Date) {
  const since = useMemo(() => homeFetchSince(now), [now])

  const patients = usePatients({ orderBy: { updatedAt: 'desc' } })
  const programs = useReusablePrograms()
  const sessions = useRecentPatientSessions({ since })
  const { devices, isLoading: devicesLoading } = useDeviceContext()

  const presenceById = useVrPresencePolling({
    enabled: devices.length > 0,
    devices: devices.map(({ data }) => ({
      id: data.id,
      deviceId: data.deviceId,
    })),
  })

  const summary = useMemo(
    () => buildHomeSessionsSummary(sessions.data ?? [], now),
    [sessions.data, now],
  )

  const patientList = patients.data ?? []
  const programList = programs.data ?? []
  const totalSessions = patientList.reduce(
    (sum, patient) => sum + patient.totalSessions,
    0,
  )

  const gettingStarted = buildGettingStarted({
    deviceCount: devices.length,
    pairedDeviceCount: devices.filter(({ data }) => data.deviceId).length,
    patientCount: patientList.length,
    programCount: programList.length,
    sessionCount: totalSessions,
  })

  const isLoading =
    patients.isPending ||
    programs.isPending ||
    sessions.isPending ||
    devicesLoading

  return {
    isLoading,
    patients: patientList,
    programs: programList,
    devices,
    presenceById,
    summary,
    gettingStarted,
  }
}
