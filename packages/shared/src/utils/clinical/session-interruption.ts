export const PatientSessionClinicalStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  INTERRUPTED: 'INTERRUPTED',
} as const

export type PatientSessionClinicalStatus =
  (typeof PatientSessionClinicalStatus)[keyof typeof PatientSessionClinicalStatus]

export function assertSessionCanBeInterrupted(status: string): void {
  if (status !== PatientSessionClinicalStatus.ACTIVE) {
    throw new Error('Only active sessions can be interrupted')
  }
}

export function isCompletedClinicalSession(status: string): boolean {
  return status === PatientSessionClinicalStatus.COMPLETED
}

export function isInterruptedClinicalSession(status: string): boolean {
  return status === PatientSessionClinicalStatus.INTERRUPTED
}

export function isClinicalHistorySession(status: string): boolean {
  return (
    isCompletedClinicalSession(status) || isInterruptedClinicalSession(status)
  )
}
