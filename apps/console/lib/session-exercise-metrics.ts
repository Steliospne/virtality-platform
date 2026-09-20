import type { ExtendedPatientSession } from '@/types/models'
import {
  getExerciseQualityScore,
  getFatigueIndex,
  getPeakCapability,
  getSetToSetAdaptation,
  getStabilityScore,
} from '@/lib/session-metrics'

/** Per-exercise metrics for one session row. Score fields are null when the exercise recorded no reps. */
export type SessionExerciseMetricRow = {
  sessionExerciseId: string
  exerciseId: string
  sets: number
  reps: number
  avgProgressPct: number | null
  bestRepPct: number | null
  consistencySd: number | null
  fatigueDropOffPct: number | null
  firstToLastSetPct: number | null
}

function indexBySessionExerciseId<T extends { sessionExerciseId: string }>(
  rows: T[],
): Map<string, T> {
  return new Map(rows.map((row) => [row.sessionExerciseId, row]))
}

/** One row per session exercise, in program order; metrics join on sessionExerciseId. */
export function buildSessionExerciseMetricRows(
  session: ExtendedPatientSession,
): SessionExerciseMetricRow[] {
  const quality = indexBySessionExerciseId(getExerciseQualityScore(session))
  const peak = indexBySessionExerciseId(getPeakCapability(session).perExercise)
  const stability = indexBySessionExerciseId(
    getStabilityScore(session, 'sd').perExercise,
  )
  const fatigue = indexBySessionExerciseId(
    getFatigueIndex(session, 'within-set').perExercise,
  )
  const setToSet = indexBySessionExerciseId(
    getSetToSetAdaptation(session).perExercise,
  )

  return [...(session.sessionExercise ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((exercise) => {
      const hasRecordedReps = quality.has(exercise.id)
      return {
        sessionExerciseId: exercise.id,
        exerciseId: exercise.exerciseId,
        sets: exercise.sets,
        reps: exercise.reps,
        avgProgressPct: quality.get(exercise.id)?.avgProgressPct ?? null,
        bestRepPct: peak.get(exercise.id)?.bestPct ?? null,
        consistencySd: hasRecordedReps
          ? (stability.get(exercise.id)?.value ?? null)
          : null,
        fatigueDropOffPct: hasRecordedReps
          ? (fatigue.get(exercise.id)?.dropOffPct ?? null)
          : null,
        firstToLastSetPct: hasRecordedReps
          ? (setToSet.get(exercise.id)?.pctChange ?? null)
          : null,
      }
    })
}
