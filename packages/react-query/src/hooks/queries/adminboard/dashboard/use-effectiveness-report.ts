import { skipToken, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useORPC } from '../../../../orpc-context.js'

export type EffectivenessReportInput =
  | {
      from: Date | string
      to: Date | string
    }
  | undefined

export type EffectivenessReportData = {
  from: string
  to: string
  summary: {
    totalPatients: number
    activePatients: number
    patientActivationRatePercent: number | null
    completedSessions: number
    averageSessionsPerActivePatient: number | null
  }
  byUser: Array<{
    userId: string | null
    userLabel: string
    totalPatients: number
    activePatients: number
    patientActivationRatePercent: number | null
    completedSessions: number
    averageSessionsPerActivePatient: number | null
  }>
  hasSessionActivity: boolean
  progressQuality: {
    averageProgressQualityPercent: number | null
    sessionsWithProgressData: number
    sessionsMissingProgressData: number
    progressQualityDeltaPercent: number | null
    trend: Array<{
      bucketStart: string
      averageProgressQualityPercent: number | null
      sessionsWithProgress: number
    }>
  }
  therapyIntensity: {
    totalTherapyDose: number
    averageTherapyDosePerSession: number | null
    averageSessionDurationMinutes: number | null
    sessionsWithDoseData: number
    sessionsMissingDoseData: number
    sessionsWithDurationData: number
    sessionsMissingDurationData: number
    trend: Array<{
      bucketStart: string
      averageTherapyDose: number | null
      sessionsWithDose: number
    }>
  }
}

export function useEffectivenessReport(
  input: EffectivenessReportInput,
): UseQueryResult<EffectivenessReportData, Error> {
  const orpc = useORPC()

  return useQuery(
    orpc.dashboard.getEffectivenessReport.queryOptions({
      input: input
        ? {
            from: input.from,
            to: input.to,
          }
        : skipToken,
    }),
  ) as UseQueryResult<EffectivenessReportData, Error>
}
