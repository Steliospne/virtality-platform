import { describe, expect, it } from 'vitest'
import type { ExtendedPatientSession } from '@/types/models'
import {
  filterSessionsByDateRange,
  getDefaultSessionDateRange,
  getSessionDateRangeForPreset,
  normalizeSessionDateRange,
  readPersistedSessionDateRange,
  persistSessionDateRange,
  getFirstCompletedSessionDay,
  getSessionCalendarDays,
} from './session-date-range'

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
  createdAt: new Date('2026-01-10T10:00:00.000Z'),
  completedAt: new Date('2026-01-15T10:00:00.000Z'),
} as ExtendedPatientSession

describe('session date range helpers', () => {
  it('anchors presets to an inclusive end date so older sessions remain visible', () => {
    const reference = new Date('2026-07-02T15:00:00.000Z')
    const range = getSessionDateRangeForPreset('3months', reference)
    const sessions = [
      {
        ...baseSession,
        id: 'recent',
        completedAt: new Date('2026-06-15T10:00:00.000Z'),
      },
      {
        ...baseSession,
        id: 'older',
        completedAt: new Date('2026-04-10T10:00:00.000Z'),
      },
      {
        ...baseSession,
        id: 'too-old',
        completedAt: new Date('2025-12-01T10:00:00.000Z'),
      },
    ] as ExtendedPatientSession[]

    const filtered = filterSessionsByDateRange(sessions, range)

    expect(filtered.map((session) => session.id)).toEqual(['recent', 'older'])
  })

  it('filters by clinical history dates using inclusive day boundaries', () => {
    const range = {
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-30T23:59:59.999Z'),
    }
    const sessions = [
      {
        ...baseSession,
        id: 'completed',
        completedAt: new Date('2026-06-15T08:30:00.000Z'),
      },
      {
        ...baseSession,
        id: 'interrupted',
        status: 'INTERRUPTED',
        completedAt: null,
        createdAt: new Date('2026-06-20T18:00:00.000Z'),
      },
      {
        ...baseSession,
        id: 'outside',
        completedAt: new Date('2026-05-01T10:00:00.000Z'),
      },
    ] as ExtendedPatientSession[]

    expect(filterSessionsByDateRange(sessions, range).map((s) => s.id)).toEqual(
      ['completed', 'interrupted'],
    )
  })

  it('defaults to the last 30 days ending today', () => {
    const reference = new Date('2026-07-02T12:00:00.000Z')
    const range = getDefaultSessionDateRange(reference)

    expect(range.endDate.toDateString()).toBe(reference.toDateString())
    expect(
      Math.round(
        (range.endDate.getTime() - range.startDate.getTime()) / 86_400_000,
      ),
    ).toBe(30)
  })

  it('normalizes inverted ranges by swapping start and end', () => {
    const normalized = normalizeSessionDateRange({
      startDate: new Date('2026-07-10T00:00:00.000Z'),
      endDate: new Date('2026-07-01T00:00:00.000Z'),
    })

    expect(normalized.startDate.getTime()).toBeLessThanOrEqual(
      normalized.endDate.getTime(),
    )
  })

  it('persists date ranges per patient in session storage', () => {
    const storage = new Map<string, string>()
    const patientId = 'patient-131'
    const range = getSessionDateRangeForPreset('week')

    persistSessionDateRange(patientId, range, {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value)
      },
    })

    expect(
      readPersistedSessionDateRange(patientId, {
        getItem: (key) => storage.get(key) ?? null,
      }),
    ).toEqual(range)
  })
})

describe('calendar helpers', () => {
  const session = (
    id: string,
    status: 'COMPLETED' | 'INTERRUPTED',
    at: string,
  ) =>
    ({
      id,
      status,
      createdAt: new Date(at),
      completedAt: status === 'COMPLETED' ? new Date(at) : null,
      deletedAt: null,
    }) as unknown as ExtendedPatientSession

  it('lists each day with a session once, including interrupted sessions', () => {
    const days = getSessionCalendarDays([
      session('a', 'COMPLETED', '2026-09-05T09:00:00'),
      session('b', 'COMPLETED', '2026-09-05T15:00:00'),
      session('c', 'INTERRUPTED', '2026-09-02T09:00:00'),
    ])

    expect(days.map((d) => d.toISOString())).toEqual([
      new Date('2026-09-02T00:00:00').toISOString(),
      new Date('2026-09-05T00:00:00').toISOString(),
    ])
  })

  it('returns the day of the earliest completed session, ignoring interrupted ones', () => {
    const first = getFirstCompletedSessionDay([
      session('a', 'COMPLETED', '2026-09-05T09:00:00'),
      session('b', 'INTERRUPTED', '2026-09-01T09:00:00'),
      session('c', 'COMPLETED', '2026-09-03T18:00:00'),
    ])

    expect(first?.toISOString()).toBe(
      new Date('2026-09-03T00:00:00').toISOString(),
    )
    expect(getFirstCompletedSessionDay([])).toBeNull()
  })
})
