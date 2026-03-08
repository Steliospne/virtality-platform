/**
 * Session metrics: visit consistency, duration, exercise quality, peak capability,
 * stability (SD/CV), fatigue index, set-to-set adaptation, dose.
 */

import type { ExtendedPatientSession, ProgressDataPoint } from '@/types/models'

const MS_PER_DAY = 86400000

/** Parse SessionData.value safely; returns array of progress points. */
function parseSessionDataValue(value: string): ProgressDataPoint[] {
  try {
    const parsed = JSON.parse(value) as ProgressDataPoint[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Get numeric "rep score" keys from a point (exclude 'rep' / first key). */
function getScoreKeys(point: ProgressDataPoint): string[] {
  const keys = Object.keys(point)
  if (keys.length <= 1) return []
  const first = keys[0]
  return keys.filter((k) => k !== first)
}

/** Single rep score: average of all set/axis values in that point. */
function repScoreFromPoint(point: ProgressDataPoint): number {
  const keys = getScoreKeys(point)
  if (keys.length === 0) return 0
  let sum = 0
  for (const k of keys) {
    const v = point[k]
    if (typeof v === 'number') sum += v
  }
  return sum / keys.length
}

/** All rep scores for one exercise (one SessionData): by rep index then by set key. */
export function getRepScoresByExercise(
  valueJson: string,
): { repIndex: number; score: number; setKey?: string }[] {
  const points = parseSessionDataValue(valueJson)
  const out: { repIndex: number; score: number; setKey?: string }[] = []
  for (const point of points) {
    const keys = getScoreKeys(point)
    if (keys.length === 0) {
      out.push({ repIndex: (point as { rep?: number }).rep ?? out.length, score: 0 })
      continue
    }
    for (const setKey of keys) {
      const v = point[setKey]
      if (typeof v === 'number') {
        out.push({
          repIndex: (point as { rep?: number }).rep ?? out.length,
          score: v,
          setKey,
        })
      }
    }
  }
  return out
}

/** Average rep progress (%) per exercise (exercise quality score). */
export function getExerciseQualityScore(
  session: ExtendedPatientSession,
): { sessionExerciseId: string; exerciseId: string; avgProgressPct: number }[] {
  const result: { sessionExerciseId: string; exerciseId: string; avgProgressPct: number }[] = []
  for (const data of session.sessionData ?? []) {
    const points = parseSessionDataValue(data.value)
    if (points.length === 0) continue
    let sum = 0
    let count = 0
    for (const point of points) {
      const s = repScoreFromPoint(point)
      sum += s
      count += 1
    }
    if (count === 0) continue
    const ex = session.sessionExercise?.find((e) => e.id === data.sessionExerciseId)
    result.push({
      sessionExerciseId: data.sessionExerciseId ?? '',
      exerciseId: ex?.exerciseId ?? '',
      avgProgressPct: sum / count,
    })
  }
  return result
}

/** Session-level average exercise quality (single number). */
export function getSessionExerciseQualityAvg(session: ExtendedPatientSession): number {
  const perEx = getExerciseQualityScore(session)
  if (perEx.length === 0) return 0
  return perEx.reduce((a, b) => a + b.avgProgressPct, 0) / perEx.length
}

/** Peak capability: best rep score per exercise and for session. */
export function getPeakCapability(session: ExtendedPatientSession): {
  perExercise: { sessionExerciseId: string; exerciseId: string; bestPct: number }[]
  sessionBest: number
} {
  const perExercise: { sessionExerciseId: string; exerciseId: string; bestPct: number }[] = []
  let sessionBest = 0
  for (const data of session.sessionData ?? []) {
    const scores = getRepScoresByExercise(data.value).map((r) => r.score)
    if (scores.length === 0) continue
    const best = Math.max(...scores)
    const ex = session.sessionExercise?.find((e) => e.id === data.sessionExerciseId)
    perExercise.push({
      sessionExerciseId: data.sessionExerciseId ?? '',
      exerciseId: ex?.exerciseId ?? '',
      bestPct: best,
    })
    if (best > sessionBest) sessionBest = best
  }
  return { perExercise, sessionBest }
}

/** Standard deviation of rep scores (per exercise or session). */
function stdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const sqDiffs = values.map((v) => (v - mean) ** 2)
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length)
}

/** Coefficient of variation (σ/mean); returns 0 if mean is 0. */
function coefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean === 0) return 0
  return stdDev(values) / mean
}

export type StabilityMode = 'sd' | 'cv'

/** Consistency/stability: SD or CV of rep scores. */
export function getStabilityScore(
  session: ExtendedPatientSession,
  mode: StabilityMode,
): {
  perExercise: { sessionExerciseId: string; exerciseId: string; value: number }[]
  sessionValue: number
} {
  const perExercise: { sessionExerciseId: string; exerciseId: string; value: number }[] = []
  const allScores: number[] = []
  for (const data of session.sessionData ?? []) {
    const scores = getRepScoresByExercise(data.value).map((r) => r.score)
    const value = mode === 'sd' ? stdDev(scores) : coefficientOfVariation(scores)
    const ex = session.sessionExercise?.find((e) => e.id === data.sessionExerciseId)
    perExercise.push({
      sessionExerciseId: data.sessionExerciseId ?? '',
      exerciseId: ex?.exerciseId ?? '',
      value,
    })
    allScores.push(...scores)
  }
  const sessionValue =
    mode === 'sd' ? stdDev(allScores) : coefficientOfVariation(allScores)
  return { perExercise, sessionValue }
}

export type FatigueMode = 'within-set' | 'across-exercise'

/**
 * Fatigue index: compare first-third vs last-third rep quality.
 * - within-set: per set (set_1, set_2, ...), first third vs last third of reps.
 * - across-exercise: all rep scores in order, first third vs last third.
 * Returns drop-off (positive = decline from start to end).
 */
export function getFatigueIndex(
  session: ExtendedPatientSession,
  mode: FatigueMode,
): {
  perExercise: { sessionExerciseId: string; exerciseId: string; dropOffPct: number }[]
  sessionDropOffPct: number
} {
  const perExercise: { sessionExerciseId: string; exerciseId: string; dropOffPct: number }[] = []

  for (const data of session.sessionData ?? []) {
    const points = parseSessionDataValue(data.value)
    const ex = session.sessionExercise?.find((e) => e.id === data.sessionExerciseId)

    if (mode === 'within-set') {
      const setKeys = new Set<string>()
      for (const p of points) getScoreKeys(p).forEach((k) => setKeys.add(k))
      const setDropOffs: number[] = []
      for (const setKey of setKeys) {
        const byRep = points
          .map((p) => ({ rep: (p as { rep?: number }).rep ?? 0, v: (p as Record<string, number>)[setKey] as number }))
          .filter((x) => typeof x.v === 'number')
          .sort((a, b) => a.rep - b.rep)
        const n = byRep.length
        if (n < 2) continue
        const firstCount = Math.max(1, Math.floor(n / 3))
        const lastCount = Math.max(1, Math.floor(n / 3))
        const firstAvg =
          byRep.slice(0, firstCount).reduce((a, r) => a + r.v, 0) / firstCount
        const lastAvg =
          byRep.slice(-lastCount).reduce((a, r) => a + r.v, 0) / lastCount
        const drop = firstAvg > 0 ? ((firstAvg - lastAvg) / firstAvg) * 100 : 0
        setDropOffs.push(drop)
      }
      const dropOffPct =
        setDropOffs.length > 0
          ? setDropOffs.reduce((a, b) => a + b, 0) / setDropOffs.length
          : 0
      perExercise.push({
        sessionExerciseId: data.sessionExerciseId ?? '',
        exerciseId: ex?.exerciseId ?? '',
        dropOffPct,
      })
    } else {
      const scores = getRepScoresByExercise(data.value)
        .sort((a, b) => a.repIndex - b.repIndex)
        .map((r) => r.score)
      if (scores.length < 2) {
        perExercise.push({
          sessionExerciseId: data.sessionExerciseId ?? '',
          exerciseId: ex?.exerciseId ?? '',
          dropOffPct: 0,
        })
        continue
      }
      const firstCount = Math.max(1, Math.floor(scores.length / 3))
      const lastCount = Math.max(1, Math.floor(scores.length / 3))
      const firstAvg =
        scores.slice(0, firstCount).reduce((a, b) => a + b, 0) / firstCount
      const lastAvg =
        scores.slice(-lastCount).reduce((a, b) => a + b, 0) / lastCount
      const dropOffPct = firstAvg > 0 ? ((firstAvg - lastAvg) / firstAvg) * 100 : 0
      perExercise.push({
        sessionExerciseId: data.sessionExerciseId ?? '',
        exerciseId: ex?.exerciseId ?? '',
        dropOffPct,
      })
    }
  }

  let sessionDropOffPct = 0
  if (perExercise.length > 0) {
    sessionDropOffPct =
      perExercise.reduce((a, b) => a + b.dropOffPct, 0) / perExercise.length
  }

  return { perExercise, sessionDropOffPct }
}

/**
 * Set-to-set adaptation: % change in average progress from set 1 to final set.
 * Positive = improving (warm-up/motor learning), negative = declining (fatigue).
 */
export function getSetToSetAdaptation(session: ExtendedPatientSession): {
  perExercise: { sessionExerciseId: string; exerciseId: string; pctChange: number }[]
  sessionPctChange: number
} {
  const perExercise: { sessionExerciseId: string; exerciseId: string; pctChange: number }[] = []
  const setChanges: number[] = []

  for (const data of session.sessionData ?? []) {
    const points = parseSessionDataValue(data.value)
    const setKeys = getScoreKeys(points[0] ?? {})
    if (setKeys.length < 2) {
      const ex = session.sessionExercise?.find((e) => e.id === data.sessionExerciseId)
      perExercise.push({
        sessionExerciseId: data.sessionExerciseId ?? '',
        exerciseId: ex?.exerciseId ?? '',
        pctChange: 0,
      })
      continue
    }
    const setAvgs: number[] = []
    for (const setKey of setKeys) {
      let sum = 0
      let count = 0
      for (const p of points) {
        const v = (p as Record<string, number>)[setKey]
        if (typeof v === 'number') {
          sum += v
          count++
        }
      }
      setAvgs.push(count ? sum / count : 0)
    }
    const firstSet = setAvgs[0]
    const lastSet = setAvgs[setAvgs.length - 1]
    const pctChange =
      firstSet !== 0 ? ((lastSet - firstSet) / firstSet) * 100 : 0
    const ex = session.sessionExercise?.find((e) => e.id === data.sessionExerciseId)
    perExercise.push({
      sessionExerciseId: data.sessionExerciseId ?? '',
      exerciseId: ex?.exerciseId ?? '',
      pctChange,
    })
    setChanges.push(pctChange)
  }

  const sessionPctChange =
    setChanges.length > 0
      ? setChanges.reduce((a, b) => a + b, 0) / setChanges.length
      : 0
  return { perExercise, sessionPctChange }
}

/** Dose: sets * reps * holdTime * speed per SessionExercise. */
export function getDosePerExercise(
  session: ExtendedPatientSession,
): { sessionExerciseId: string; exerciseId: string; dose: number }[] {
  return (session.sessionExercise ?? []).map((ex) => ({
    sessionExerciseId: ex.id,
    exerciseId: ex.exerciseId,
    dose: ex.sets * ex.reps * ex.holdTime * ex.speed,
  }))
}

export function getDosePerSession(session: ExtendedPatientSession): number {
  return getDosePerExercise(session).reduce((a, b) => a + b.dose, 0)
}

/** Dose trend over time (by completedAt). */
export function getDoseTrend(
  sessions: ExtendedPatientSession[],
): { sessionId: string; completedAt: Date; dose: number }[] {
  const completed = sessions.filter((s) => s.completedAt != null)
  return completed
    .map((s) => ({
      sessionId: s.id,
      completedAt: new Date(s.completedAt!),
      dose: getDosePerSession(s),
    }))
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
}

/** Session duration in minutes (completedAt - createdAt). */
export function getSessionDurationMinutes(session: ExtendedPatientSession): number | null {
  if (!session.completedAt || !session.createdAt) return null
  const start = new Date(session.createdAt).getTime()
  const end = new Date(session.completedAt).getTime()
  return (end - start) / 60_000
}

/** Duration trend: list of sessions with duration. */
export function getSessionDurationTrend(
  sessions: ExtendedPatientSession[],
): { sessionId: string; completedAt: Date; durationMin: number }[] {
  return sessions
    .filter((s) => s.completedAt != null)
    .map((s) => ({
      sessionId: s.id,
      completedAt: new Date(s.completedAt!),
      durationMin: getSessionDurationMinutes(s) ?? 0,
    }))
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
}

/** Calendar-day key (YYYY-MM-DD) for a date. */
function toDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Visit consistency: average days between completed sessions; gaps above threshold. Ignores multiple sessions on the same day (one visit per day). */
export function getVisitConsistency(
  sessions: ExtendedPatientSession[],
  gapThresholdDays: number,
): {
  avgDaysBetween: number | null
  gaps: { prevCompletedAt: Date; nextCompletedAt: Date; daysBetween: number; nextSessionId: string }[]
} {
  const completed = sessions
    .filter((s) => s.completedAt != null)
    .map((s) => ({ id: s.id, completedAt: new Date(s.completedAt!) }))
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())

  const byDay = new Map<string, { id: string; completedAt: Date }>()
  for (const s of completed) {
    const key = toDayKey(s.completedAt)
    byDay.set(key, s)
  }
  const uniqueDays = Array.from(byDay.values()).sort(
    (a, b) => a.completedAt.getTime() - b.completedAt.getTime(),
  )

  if (uniqueDays.length < 2) {
    return { avgDaysBetween: null, gaps: [] }
  }

  let totalDays = 0
  const gaps: { prevCompletedAt: Date; nextCompletedAt: Date; daysBetween: number; nextSessionId: string }[] = []
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = uniqueDays[i - 1].completedAt.getTime()
    const next = uniqueDays[i].completedAt.getTime()
    const daysBetween = (next - prev) / MS_PER_DAY
    totalDays += daysBetween
    if (daysBetween > gapThresholdDays) {
      gaps.push({
        prevCompletedAt: uniqueDays[i - 1].completedAt,
        nextCompletedAt: uniqueDays[i].completedAt,
        daysBetween,
        nextSessionId: uniqueDays[i].id,
      })
    }
  }
  const avgDaysBetween = totalDays / (uniqueDays.length - 1)
  return { avgDaysBetween, gaps }
}

export type DateRangePreset = 'week' | 'month' | '3months'

export const DATE_RANGE_DAYS: Record<DateRangePreset, number> = {
  week: 7,
  month: 30,
  '3months': 90,
}

/** Filter sessions to those completed within [startDate, startDate + rangeDays]. */
export function filterSessionsByDateRange(
  sessions: ExtendedPatientSession[],
  startDate: Date,
  rangePreset: DateRangePreset,
): ExtendedPatientSession[] {
  const rangeDays = DATE_RANGE_DAYS[rangePreset]
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + rangeDays)
  const startMs = startDate.getTime()
  const endMs = endDate.getTime()
  return sessions.filter((s) => {
    if (!s.completedAt) return false
    const t = new Date(s.completedAt).getTime()
    return t >= startMs && t <= endMs
  })
}
