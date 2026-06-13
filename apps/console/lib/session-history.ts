import {
  isClinicalHistorySession,
  isCompletedClinicalSession,
  isInterruptedClinicalSession,
} from '@virtality/shared/utils'
import type { ExtendedPatientSession } from '@/types/models'

export function filterClinicalHistorySessions(
  sessions: ExtendedPatientSession[],
): ExtendedPatientSession[] {
  return sessions.filter((session) => isClinicalHistorySession(session.status))
}

export function filterCompletedClinicalSessions(
  sessions: ExtendedPatientSession[],
): ExtendedPatientSession[] {
  return sessions.filter((session) =>
    isCompletedClinicalSession(session.status),
  )
}

export function getClinicalHistorySessionDate(
  session: ExtendedPatientSession,
): Date | null {
  if (isCompletedClinicalSession(session.status) && session.completedAt) {
    return new Date(session.completedAt)
  }

  if (isInterruptedClinicalSession(session.status) && session.createdAt) {
    return new Date(session.createdAt)
  }

  return null
}

export function getClinicalHistorySessionStatusLabel(
  status: string,
): 'Completed' | 'Interrupted' | null {
  if (isCompletedClinicalSession(status)) return 'Completed'
  if (isInterruptedClinicalSession(status)) return 'Interrupted'
  return null
}
