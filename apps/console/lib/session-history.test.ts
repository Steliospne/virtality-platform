import { describe, expect, it } from 'vitest'
import type { ExtendedPatientSession } from '@/types/models'
import {
  filterClinicalHistorySessions,
  filterCompletedClinicalSessions,
  getClinicalHistorySessionDate,
  getClinicalHistorySessionStatusLabel,
} from './session-history'

const baseSession = {
  id: 'session-1',
  patientId: 'patient-1',
  programId: null,
  status: 'COMPLETED',
  sourceReusableProgramId: null,
  sourceProgramName: null,
  nprs: null,
  notes: null,
  deletedAt: null,
  createdAt: new Date('2026-06-13T10:00:00.000Z'),
  completedAt: new Date('2026-06-13T11:00:00.000Z'),
} as ExtendedPatientSession

describe('session history helpers', () => {
  it('includes completed and interrupted sessions in clinical history', () => {
    const sessions = [
      { ...baseSession, id: 'completed', status: 'COMPLETED' },
      {
        ...baseSession,
        id: 'interrupted',
        status: 'INTERRUPTED',
        completedAt: null,
      },
      { ...baseSession, id: 'active', status: 'ACTIVE', completedAt: null },
    ] as ExtendedPatientSession[]

    expect(filterClinicalHistorySessions(sessions).map((s) => s.id)).toEqual([
      'completed',
      'interrupted',
    ])
    expect(filterCompletedClinicalSessions(sessions).map((s) => s.id)).toEqual([
      'completed',
    ])
  })

  it('uses completedAt for completed sessions and createdAt for interrupted sessions', () => {
    const interrupted = {
      ...baseSession,
      status: 'INTERRUPTED',
      completedAt: null,
    } as ExtendedPatientSession

    expect(getClinicalHistorySessionDate(baseSession)?.toISOString()).toBe(
      '2026-06-13T11:00:00.000Z',
    )
    expect(getClinicalHistorySessionDate(interrupted)?.toISOString()).toBe(
      '2026-06-13T10:00:00.000Z',
    )
  })

  it('labels clinical history statuses for the UI', () => {
    expect(getClinicalHistorySessionStatusLabel('COMPLETED')).toBe('Completed')
    expect(getClinicalHistorySessionStatusLabel('INTERRUPTED')).toBe(
      'Interrupted',
    )
    expect(getClinicalHistorySessionStatusLabel('ACTIVE')).toBeNull()
  })
})
