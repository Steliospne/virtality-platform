import type { ExtendedPatientSession } from '@/types/models'
import {
  getClinicalHistorySessionDate,
  getSessionSourceProgramDisplayName,
} from '@/lib/session-history'
import {
  getExerciseQualityScore,
  getPeakCapability,
  getSessionDurationMinutes,
} from '@/lib/session-metrics'

/** Row model for the patient sessions table: one session plus the numbers the list shows. */
export type SessionListRowModel = {
  id: string
  session: ExtendedPatientSession
  date: Date | null
  programName: string
  durationMin: number | null
  exercisesDone: number
  exercisesPlanned: number
  avgProgressPct: number | null
  /** Change in average progress vs the previous session that recorded reps; null for the first. */
  progressDeltaPct: number | null
  bestRepPct: number | null
  hasNotes: boolean
}

function buildRowWithoutDelta(
  session: ExtendedPatientSession,
): Omit<SessionListRowModel, 'progressDeltaPct'> {
  const quality = getExerciseQualityScore(session)
  const avgProgressPct = quality.length
    ? quality.reduce((sum, ex) => sum + ex.avgProgressPct, 0) / quality.length
    : null
  const { sessionBest } = getPeakCapability(session)

  return {
    id: session.id,
    session,
    date: getClinicalHistorySessionDate(session),
    programName: getSessionSourceProgramDisplayName(session),
    durationMin: getSessionDurationMinutes(session),
    exercisesDone: quality.length,
    exercisesPlanned: session.sessionExercise?.length ?? 0,
    avgProgressPct,
    bestRepPct: quality.length ? sessionBest : null,
    hasNotes: Boolean(session.notes?.trim()),
  }
}

/**
 * Builds table rows in chronological order. The progress delta compares each
 * session to the previous one (by date) that recorded any reps, across the
 * whole list given, so pass the full history rather than a date-filtered slice.
 */
export function buildSessionListRows(
  sessions: ExtendedPatientSession[],
): SessionListRowModel[] {
  const ordered = sessions
    .map(buildRowWithoutDelta)
    .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0))

  let previousAvg: number | null = null
  return ordered.map((row) => {
    const progressDeltaPct =
      row.avgProgressPct != null && previousAvg != null
        ? row.avgProgressPct - previousAvg
        : null
    if (row.avgProgressPct != null) previousAvg = row.avgProgressPct
    return { ...row, progressDeltaPct }
  })
}
