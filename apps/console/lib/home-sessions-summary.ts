import { addDays, differenceInMinutes, format, startOfDay } from 'date-fns'
import { isCompletedClinicalSession } from '@virtality/shared/utils'
import { getSessionSourceProgramDisplayName } from '@/lib/session-history'

/** Rolling window shown on the home dashboard: today and the 6 days before. */
export const HOME_WINDOW_DAYS = 7

export type HomeSessionRow = {
  id: string
  patientId: string
  status: string
  createdAt: Date | string
  completedAt: Date | string | null
  sourceReusableProgramId: string | null
  sourceProgramName: string | null
  patient: { id: string; name: string; image: string | null }
}

export type HomeSessionDay = {
  /** Local calendar day the bucket covers. */
  date: Date
  /** Short weekday label for the axis, e.g. "Mon". */
  label: string
  count: number
}

export type HomeProgramCount = { name: string; count: number }

export type HomeLastSession = {
  id: string
  patientId: string
  patientName: string
  patientImage: string | null
  programName: string
  at: Date
  durationMin: number | null
  completed: boolean
}

export type HomeSessionsSummary = {
  days: HomeSessionDay[]
  windowStart: Date
  windowEnd: Date
  total: number
  deltaVsPriorWeek: number
  completed: number
  interrupted: number
  avgLengthMin: number | null
  headsetMinutes: number
  byProgram: HomeProgramCount[]
  lastSession: HomeLastSession | null
}

/** Start of the rolling window: local midnight, six days before `now`. */
export function homeWindowStart(now: Date): Date {
  return startOfDay(addDays(now, -(HOME_WINDOW_DAYS - 1)))
}

/** Fetch bound that also covers the prior week for the delta. */
export function homeFetchSince(now: Date): Date {
  return addDays(homeWindowStart(now), -HOME_WINDOW_DAYS)
}

function sessionAt(session: HomeSessionRow): Date {
  return new Date(session.createdAt)
}

function sessionDurationMin(session: HomeSessionRow): number | null {
  if (!session.completedAt) return null
  const minutes = differenceInMinutes(
    new Date(session.completedAt),
    sessionAt(session),
  )
  return minutes < 0 ? null : minutes
}

function emptyDays(windowStart: Date): HomeSessionDay[] {
  return Array.from({ length: HOME_WINDOW_DAYS }, (_, i) => {
    const date = addDays(windowStart, i)
    return { date, label: format(date, 'EEE'), count: 0 }
  })
}

export function buildHomeSessionsSummary(
  sessions: HomeSessionRow[],
  now: Date,
): HomeSessionsSummary {
  const windowStart = homeWindowStart(now)
  const windowEnd = addDays(windowStart, HOME_WINDOW_DAYS)
  const priorStart = addDays(windowStart, -HOME_WINDOW_DAYS)

  const days = emptyDays(windowStart)
  const byProgram = new Map<string, number>()
  let priorCount = 0
  let completed = 0
  let interrupted = 0
  let headsetMinutes = 0
  let lengthSum = 0
  let lengthCount = 0
  let latest: HomeSessionRow | null = null

  for (const session of sessions) {
    const at = sessionAt(session)
    if (at < priorStart || at >= windowEnd) continue
    if (at < windowStart) {
      priorCount += 1
      continue
    }

    const dayIndex = Math.floor(
      (startOfDay(at).getTime() - windowStart.getTime()) / 86_400_000,
    )
    const day = days[dayIndex]
    if (day) day.count += 1

    if (isCompletedClinicalSession(session.status)) completed += 1
    else interrupted += 1

    const durationMin = sessionDurationMin(session)
    if (durationMin !== null) {
      headsetMinutes += durationMin
      lengthSum += durationMin
      lengthCount += 1
    }

    const programName = getSessionSourceProgramDisplayName(session)
    byProgram.set(programName, (byProgram.get(programName) ?? 0) + 1)

    if (!latest || at > sessionAt(latest)) latest = session
  }

  const total = completed + interrupted

  return {
    days,
    windowStart,
    windowEnd,
    total,
    deltaVsPriorWeek: total - priorCount,
    completed,
    interrupted,
    avgLengthMin: lengthCount ? Math.round(lengthSum / lengthCount) : null,
    headsetMinutes,
    byProgram: [...byProgram.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    lastSession: latest
      ? {
          id: latest.id,
          patientId: latest.patientId,
          patientName: latest.patient.name,
          patientImage: latest.patient.image,
          programName: getSessionSourceProgramDisplayName(latest),
          at: sessionAt(latest),
          durationMin: sessionDurationMin(latest),
          completed: isCompletedClinicalSession(latest.status),
        }
      : null,
  }
}

/** "3 h 40 m", "20 min", or "0 min". */
export function formatHeadsetTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} m` : `${hours} h`
}

/** "+4 vs last week", "−2 vs last week", "Same as last week". */
export function formatWeekDelta(delta: number): string {
  if (delta === 0) return 'Same as last week'
  const sign = delta > 0 ? '+' : '−'
  return `${sign}${Math.abs(delta)} vs last week`
}

/** "Sun 14 – Sat 20 Sep" (or with both months when the window spans two). */
export function formatHomeWindow(windowStart: Date, windowEnd: Date): string {
  const last = addDays(windowEnd, -1)
  const sameMonth = windowStart.getMonth() === last.getMonth()
  const startLabel = format(windowStart, sameMonth ? 'EEE d' : 'EEE d MMM')
  return `${startLabel} – ${format(last, 'EEE d MMM')}`
}
