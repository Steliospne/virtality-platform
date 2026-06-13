import type { PatientSession } from '@virtality/db'
import {
  isClinicalHistorySession,
  isCompletedClinicalSession,
  isInterruptedClinicalSession,
} from '@virtality/shared/utils'
import type { ExtendedPatientSession } from '@/types/models'

export const QUICK_START_SESSION_LABEL = 'Quick Start'

export function getSessionSourceProgramDisplayName(
  session: Pick<
    PatientSession,
    'sourceProgramName' | 'sourceReusableProgramId'
  >,
): string {
  const storedName = session.sourceProgramName?.trim()
  if (storedName) return storedName

  if (!session.sourceReusableProgramId) {
    return QUICK_START_SESSION_LABEL
  }

  return 'Unknown program'
}

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
