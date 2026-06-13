import { describe, expect, it } from 'vitest'
import { UNKNOWN_OWNER_ID, UNKNOWN_OWNER_LABEL } from './analytics-filters.ts'
import { buildEffectivenessReport } from './effectiveness-report-aggregation.ts'

const progressValue = (scores: number[]) =>
  JSON.stringify(
    scores.map((score, index) => ({ rep: index + 1, set_1: score })),
  )

const baseInput = {
  from: '2026-06-01',
  to: '2026-06-30',
  userNamesById: {} as Record<string, string | null | undefined>,
}

describe('buildEffectivenessReport', () => {
  it('groups patients and completed sessions by owner', () => {
    const report = buildEffectivenessReport({
      ...baseInput,
      patients: [
        { id: 'patient-1', userId: 'user-a' },
        { id: 'patient-2', userId: 'user-a' },
        { id: 'patient-3', userId: 'user-b' },
      ],
      sessions: [
        {
          patientId: 'patient-1',
          completedAt: '2026-06-10T10:00:00.000Z',
          sessionData: [],
        },
        {
          patientId: 'patient-1',
          completedAt: '2026-06-12T10:00:00.000Z',
          sessionData: [],
        },
        {
          patientId: 'patient-3',
          completedAt: '2026-06-11T10:00:00.000Z',
          sessionData: [],
        },
      ],
      userNamesById: {
        'user-a': 'Alice',
        'user-b': 'Bob',
      },
    })

    expect(report.summary).toEqual({
      totalPatients: 3,
      activePatients: 2,
      patientActivationRatePercent: 66.7,
      completedSessions: 3,
      averageSessionsPerActivePatient: 1.5,
    })

    expect(report.byUser).toEqual([
      {
        userId: 'user-a',
        userLabel: 'Alice',
        totalPatients: 2,
        activePatients: 1,
        patientActivationRatePercent: 50,
        completedSessions: 2,
        averageSessionsPerActivePatient: 2,
      },
      {
        userId: 'user-b',
        userLabel: 'Bob',
        totalPatients: 1,
        activePatients: 1,
        patientActivationRatePercent: 100,
        completedSessions: 1,
        averageSessionsPerActivePatient: 1,
      },
    ])
    expect(report.hasSessionActivity).toBe(true)
  })

  it('uses stable labels for unknown or missing owner names', () => {
    const report = buildEffectivenessReport({
      ...baseInput,
      patients: [
        { id: 'patient-1', userId: null },
        { id: 'patient-2', userId: 'user-missing-name' },
      ],
      sessions: [
        {
          patientId: 'patient-1',
          completedAt: '2026-06-10T10:00:00.000Z',
          sessionData: [],
        },
      ],
      userNamesById: {},
    })

    expect(report.byUser).toEqual([
      {
        userId: UNKNOWN_OWNER_ID,
        userLabel: UNKNOWN_OWNER_LABEL,
        totalPatients: 1,
        activePatients: 1,
        patientActivationRatePercent: 100,
        completedSessions: 1,
        averageSessionsPerActivePatient: 1,
      },
      {
        userId: 'user-missing-name',
        userLabel: 'Unnamed owner',
        totalPatients: 1,
        activePatients: 0,
        patientActivationRatePercent: 0,
        completedSessions: 0,
        averageSessionsPerActivePatient: null,
      },
    ])
  })

  it('returns null rates and averages when denominators are zero', () => {
    const report = buildEffectivenessReport({
      ...baseInput,
      patients: [],
      sessions: [],
      userNamesById: {},
    })

    expect(report.summary).toEqual({
      totalPatients: 0,
      activePatients: 0,
      patientActivationRatePercent: null,
      completedSessions: 0,
      averageSessionsPerActivePatient: null,
    })
    expect(report.byUser).toEqual([])
    expect(report.hasSessionActivity).toBe(false)
    expect(report.progressQuality).toEqual({
      averageProgressQualityPercent: null,
      sessionsWithProgressData: 0,
      sessionsMissingProgressData: 0,
      progressQualityDeltaPercent: null,
      trend: expect.any(Array),
    })
  })

  it('ignores sessions for patients outside the scoped patient list', () => {
    const report = buildEffectivenessReport({
      ...baseInput,
      patients: [{ id: 'patient-1', userId: 'user-a' }],
      sessions: [
        {
          patientId: 'patient-orphan',
          completedAt: '2026-06-10T10:00:00.000Z',
          sessionData: [],
        },
      ],
      userNamesById: { 'user-a': 'Alice' },
    })

    expect(report.summary.completedSessions).toBe(0)
    expect(report.summary.activePatients).toBe(0)
    expect(report.byUser[0]).toMatchObject({
      userId: 'user-a',
      completedSessions: 0,
      activePatients: 0,
    })
  })

  it('calculates progress quality, trend buckets, and first-vs-latest delta', () => {
    const report = buildEffectivenessReport({
      from: '2026-06-02',
      to: '2026-06-16',
      patients: [{ id: 'patient-1', userId: 'user-a' }],
      sessions: [
        {
          patientId: 'patient-1',
          completedAt: '2026-06-03T10:00:00.000Z',
          sessionData: [{ value: progressValue([50]) }],
        },
        {
          patientId: 'patient-1',
          completedAt: '2026-06-10T10:00:00.000Z',
          sessionData: [{ value: progressValue([70]) }],
        },
        {
          patientId: 'patient-1',
          completedAt: '2026-06-15T10:00:00.000Z',
          sessionData: [{ value: 'not-json' }],
        },
      ],
      userNamesById: { 'user-a': 'Alice' },
    })

    expect(report.progressQuality.averageProgressQualityPercent).toBe(60)
    expect(report.progressQuality.sessionsWithProgressData).toBe(2)
    expect(report.progressQuality.sessionsMissingProgressData).toBe(1)
    expect(report.progressQuality.progressQualityDeltaPercent).toBe(20)

    const weekWithFifty = report.progressQuality.trend.find(
      (point) => point.averageProgressQualityPercent === 50,
    )
    const weekWithSeventy = report.progressQuality.trend.find(
      (point) => point.averageProgressQualityPercent === 70,
    )
    expect(weekWithFifty?.sessionsWithProgress).toBe(1)
    expect(weekWithSeventy?.sessionsWithProgress).toBe(1)
  })
})
