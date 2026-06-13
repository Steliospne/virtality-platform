import { describe, expect, it } from 'vitest'
import type { ExtendedPatientSession } from '@/types/models'
import {
  filterClinicalHistorySessions,
  filterCompletedClinicalSessions,
  getClinicalHistorySessionDate,
  getClinicalHistorySessionStatusLabel,
  getSessionSourceProgramDisplayName,
  QUICK_START_SESSION_LABEL,
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

describe('session source program display', () => {
  it('shows the stored source program name when available', () => {
    expect(
      getSessionSourceProgramDisplayName({
        sourceProgramName: 'Shoulder rehab',
        sourceReusableProgramId: 'program-1',
      }),
    ).toBe('Shoulder rehab')
  })

  it('shows Quick Start for ad hoc sessions without a source program', () => {
    expect(
      getSessionSourceProgramDisplayName({
        sourceProgramName: null,
        sourceReusableProgramId: null,
      }),
    ).toBe(QUICK_START_SESSION_LABEL)
  })

  it('keeps the stored name after the library program is renamed or retired', () => {
    expect(
      getSessionSourceProgramDisplayName({
        sourceProgramName: 'Original shoulder plan',
        sourceReusableProgramId: 'retired-program',
      }),
    ).toBe('Original shoulder plan')
  })

  it('does not depend on patient-program assignment lookups', () => {
    const session = {
      programId: 'legacy-patient-program',
      sourceProgramName: 'Migrated library program',
      sourceReusableProgramId: 'program-1',
    }

    expect(getSessionSourceProgramDisplayName(session)).toBe(
      'Migrated library program',
    )
  })
})
