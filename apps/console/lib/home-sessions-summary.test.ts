import { describe, expect, it } from 'vitest'
import {
  buildHomeSessionsSummary,
  formatHeadsetTime,
  formatHomeWindow,
  formatWeekDelta,
  homeFetchSince,
  homeWindowStart,
  type HomeSessionRow,
} from './home-sessions-summary'

// Saturday 20 Sep 2026, 10:00 local.
const now = new Date(2026, 8, 20, 10, 0, 0)

const patient = { id: 'p1', name: 'Maria Konstantinou', image: null }

function session(
  overrides: Partial<HomeSessionRow> & { createdAt: Date },
): HomeSessionRow {
  return {
    id: overrides.createdAt.toISOString(),
    patientId: patient.id,
    status: 'COMPLETED',
    completedAt: new Date(overrides.createdAt.getTime() + 20 * 60_000),
    sourceReusableProgramId: 'rp1',
    sourceProgramName: 'Shoulder recovery A',
    patient,
    ...overrides,
  }
}

describe('home window', () => {
  it('starts at local midnight six days before now', () => {
    expect(homeWindowStart(now)).toEqual(new Date(2026, 8, 14, 0, 0, 0))
  })

  it('fetches one extra week for the prior-week delta', () => {
    expect(homeFetchSince(now)).toEqual(new Date(2026, 8, 7, 0, 0, 0))
  })
})

describe('buildHomeSessionsSummary', () => {
  it('buckets sessions by local day across the seven-day window', () => {
    const summary = buildHomeSessionsSummary(
      [
        session({ createdAt: new Date(2026, 8, 14, 0, 30) }),
        session({ createdAt: new Date(2026, 8, 15, 9) }),
        session({ createdAt: new Date(2026, 8, 15, 17) }),
        session({ createdAt: new Date(2026, 8, 20, 9, 59) }),
      ],
      now,
    )

    expect(summary.days.map((d) => d.label)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ])
    expect(summary.days.map((d) => d.count)).toEqual([1, 2, 0, 0, 0, 0, 1])
    expect(summary.total).toBe(4)
  })

  it('ignores sessions outside the fetch window and counts the prior week only for the delta', () => {
    const summary = buildHomeSessionsSummary(
      [
        session({ createdAt: new Date(2026, 8, 6, 12) }),
        session({ createdAt: new Date(2026, 8, 7, 0, 0) }),
        session({ createdAt: new Date(2026, 8, 13, 23, 59) }),
        session({ createdAt: new Date(2026, 8, 18, 12) }),
        session({ createdAt: new Date(2026, 8, 21, 0, 0) }),
      ],
      now,
    )

    expect(summary.total).toBe(1)
    expect(summary.deltaVsPriorWeek).toBe(-1)
  })

  it('splits completed from interrupted and only times sessions that finished', () => {
    const summary = buildHomeSessionsSummary(
      [
        session({ createdAt: new Date(2026, 8, 16, 9) }),
        session({
          createdAt: new Date(2026, 8, 16, 11),
          completedAt: new Date(2026, 8, 16, 11, 40),
        }),
        session({
          createdAt: new Date(2026, 8, 17, 9),
          status: 'INTERRUPTED',
          completedAt: null,
        }),
      ],
      now,
    )

    expect(summary.completed).toBe(2)
    expect(summary.interrupted).toBe(1)
    expect(summary.avgLengthMin).toBe(30)
    expect(summary.headsetMinutes).toBe(60)
  })

  it('groups by source program name, labelling ad hoc sessions as Quick Start', () => {
    const summary = buildHomeSessionsSummary(
      [
        session({ createdAt: new Date(2026, 8, 16, 9) }),
        session({ createdAt: new Date(2026, 8, 16, 10) }),
        session({
          createdAt: new Date(2026, 8, 16, 11),
          sourceProgramName: 'Wrist mobility starter',
        }),
        session({
          createdAt: new Date(2026, 8, 16, 12),
          sourceReusableProgramId: null,
          sourceProgramName: null,
        }),
      ],
      now,
    )

    expect(summary.byProgram).toEqual([
      { name: 'Shoulder recovery A', count: 2 },
      { name: 'Quick Start', count: 1 },
      { name: 'Wrist mobility starter', count: 1 },
    ])
  })

  it('reports the most recent session in the window', () => {
    const summary = buildHomeSessionsSummary(
      [
        session({ createdAt: new Date(2026, 8, 19, 17, 40) }),
        session({ createdAt: new Date(2026, 8, 18, 9) }),
      ],
      now,
    )

    expect(summary.lastSession).toMatchObject({
      patientName: 'Maria Konstantinou',
      programName: 'Shoulder recovery A',
      durationMin: 20,
      completed: true,
    })
    expect(summary.lastSession?.at).toEqual(new Date(2026, 8, 19, 17, 40))
  })

  it('returns an empty week when there are no sessions', () => {
    const summary = buildHomeSessionsSummary([], now)

    expect(summary.total).toBe(0)
    expect(summary.avgLengthMin).toBeNull()
    expect(summary.lastSession).toBeNull()
    expect(summary.byProgram).toEqual([])
    expect(summary.days).toHaveLength(7)
  })
})

describe('formatters', () => {
  it('formats headset time', () => {
    expect(formatHeadsetTime(0)).toBe('0 min')
    expect(formatHeadsetTime(20)).toBe('20 min')
    expect(formatHeadsetTime(120)).toBe('2 h')
    expect(formatHeadsetTime(220)).toBe('3 h 40 m')
  })

  it('formats the week delta', () => {
    expect(formatWeekDelta(4)).toBe('+4 vs last week')
    expect(formatWeekDelta(-2)).toBe('−2 vs last week')
    expect(formatWeekDelta(0)).toBe('Same as last week')
  })

  it('formats the window range', () => {
    const summary = buildHomeSessionsSummary([], now)
    expect(formatHomeWindow(summary.windowStart, summary.windowEnd)).toBe(
      'Mon 14 – Sun 20 Sep',
    )
    const crossing = buildHomeSessionsSummary([], new Date(2026, 9, 3))
    expect(formatHomeWindow(crossing.windowStart, crossing.windowEnd)).toBe(
      'Sun 27 Sep – Sat 3 Oct',
    )
  })
})
