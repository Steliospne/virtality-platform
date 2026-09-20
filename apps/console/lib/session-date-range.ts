import { endOfDay, isSameDay, startOfDay, subDays } from 'date-fns'
import {
  filterClinicalHistorySessions,
  filterCompletedClinicalSessions,
  getClinicalHistorySessionDate,
} from '@/lib/session-history'
import type { ExtendedPatientSession } from '@/types/models'

export type DateRangePreset = 'week' | 'month' | '3months'

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  'week',
  'month',
  '3months',
]

const MS_PER_DAY = 86_400_000

export const DATE_RANGE_DAYS: Record<DateRangePreset, number> = {
  week: 7,
  month: 30,
  '3months': 90,
}

export const DATE_RANGE_PRESET_LABELS: Record<DateRangePreset, string> = {
  week: 'Last 7 days',
  month: 'Last 30 days',
  '3months': 'Last 90 days',
}

export type SessionDateRange = {
  startDate: Date
  endDate: Date
}

type SessionStorageLike = Pick<Storage, 'getItem' | 'setItem'>

type SessionStorageReader = Pick<Storage, 'getItem'>

const STORAGE_PREFIX = 'patient-profile:session-date-range:'

function resolveSessionStorage(
  storage?: SessionStorageLike | SessionStorageReader | null,
): SessionStorageLike | SessionStorageReader | null {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

function storageKey(patientId: string): string {
  return `${STORAGE_PREFIX}${patientId}`
}

type StoredSessionDateRange = {
  startDate: string
  endDate: string
}

export function normalizeSessionDateRange(
  range: SessionDateRange,
): SessionDateRange {
  const startMs = startOfDay(range.startDate).getTime()
  const endMs = endOfDay(range.endDate).getTime()

  if (startMs <= endMs) {
    return {
      startDate: new Date(startMs),
      endDate: new Date(endMs),
    }
  }

  return {
    startDate: new Date(endMs),
    endDate: new Date(startMs),
  }
}

export function getSessionDateRangeForPreset(
  preset: DateRangePreset,
  endDate: Date = new Date(),
): SessionDateRange {
  const normalizedEnd = endOfDay(endDate)
  const dayCount = DATE_RANGE_DAYS[preset]
  const startDate = startOfDay(subDays(normalizedEnd, dayCount - 1))

  return { startDate, endDate: normalizedEnd }
}

export function getDefaultSessionDateRange(
  referenceDate: Date = new Date(),
): SessionDateRange {
  return getSessionDateRangeForPreset('month', referenceDate)
}

export function getRangeSpanDays(range: SessionDateRange): number {
  const normalized = normalizeSessionDateRange(range)
  const startMs = startOfDay(normalized.startDate).getTime()
  const endMs = startOfDay(normalized.endDate).getTime()
  return Math.max(1, Math.round((endMs - startMs) / MS_PER_DAY) + 1)
}

export function filterSessionsByDateRange(
  sessions: ExtendedPatientSession[],
  range: SessionDateRange,
): ExtendedPatientSession[] {
  const { startDate, endDate } = normalizeSessionDateRange(range)
  const startMs = startDate.getTime()
  const endMs = endDate.getTime()

  return filterClinicalHistorySessions(sessions).filter((session) => {
    const historyDate = getClinicalHistorySessionDate(session)
    if (!historyDate) return false
    const timestamp = historyDate.getTime()
    return timestamp >= startMs && timestamp <= endMs
  })
}

/** Calendar days (local, start of day) that have at least one clinical-history session. */
export function getSessionCalendarDays(
  sessions: ExtendedPatientSession[],
): Date[] {
  const days: Date[] = []
  for (const session of filterClinicalHistorySessions(sessions)) {
    const historyDate = getClinicalHistorySessionDate(session)
    if (!historyDate) continue
    const day = startOfDay(historyDate)
    if (!days.some((existing) => isSameDay(existing, day))) days.push(day)
  }
  return days.sort((a, b) => a.getTime() - b.getTime())
}

/** Start of the day of the earliest completed session, or null when there is none. */
export function getFirstCompletedSessionDay(
  sessions: ExtendedPatientSession[],
): Date | null {
  let earliest: Date | null = null
  for (const session of filterCompletedClinicalSessions(sessions)) {
    if (!session.completedAt) continue
    const completedAt = new Date(session.completedAt)
    if (!earliest || completedAt < earliest) earliest = completedAt
  }
  return earliest ? startOfDay(earliest) : null
}

export function readPersistedSessionDateRange(
  patientId: string,
  storage: SessionStorageReader | null = resolveSessionStorage(),
): SessionDateRange | null {
  if (!storage) return null

  const raw = storage.getItem(storageKey(patientId))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredSessionDateRange
    if (!parsed.startDate || !parsed.endDate) return null

    return normalizeSessionDateRange({
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
    })
  } catch {
    return null
  }
}

export function persistSessionDateRange(
  patientId: string,
  range: SessionDateRange,
  storage?: SessionStorageLike | SessionStorageReader | null,
): void {
  const resolved = resolveSessionStorage(storage)
  if (!resolved || !('setItem' in resolved)) return

  const normalized = normalizeSessionDateRange(range)
  const payload: StoredSessionDateRange = {
    startDate: normalized.startDate.toISOString(),
    endDate: normalized.endDate.toISOString(),
  }
  resolved.setItem(storageKey(patientId), JSON.stringify(payload))
}
