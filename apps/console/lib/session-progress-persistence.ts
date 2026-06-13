import type { ProgressDataPoint } from '@/types/models'
import type { SessionExerciseRowInput } from './patient-dashboard-session-launch'

export type SessionProgressUpsertInput = {
  patientSessionId: string
  sessionExerciseId: string
  value: string
}

export function serializeSessionProgressValue(
  progressPoints: ReadonlyArray<ProgressDataPoint>,
): string {
  return JSON.stringify(progressPoints)
}

export function buildCurrentExerciseProgressUpsert(input: {
  patientSessionId: string
  sessionExercise: SessionExerciseRowInput
  progressPoints: ReadonlyArray<ProgressDataPoint>
}): SessionProgressUpsertInput {
  return {
    patientSessionId: input.patientSessionId,
    sessionExerciseId: input.sessionExercise.id,
    value: serializeSessionProgressValue(input.progressPoints),
  }
}

export function buildSessionProgressUpserts(input: {
  patientSessionId: string
  sessionExerciseRows: ReadonlyArray<SessionExerciseRowInput>
  progressByExerciseId: Readonly<
    Record<string, ReadonlyArray<ProgressDataPoint> | undefined>
  >
  currentExerciseIndex: number
  currentExerciseProgress: ReadonlyArray<ProgressDataPoint>
}): SessionProgressUpsertInput[] {
  return input.sessionExerciseRows.map((sessionExercise, index) => {
    const progressPoints =
      index === input.currentExerciseIndex
        ? input.currentExerciseProgress
        : (input.progressByExerciseId[sessionExercise.exerciseId] ?? [])

    return buildCurrentExerciseProgressUpsert({
      patientSessionId: input.patientSessionId,
      sessionExercise,
      progressPoints,
    })
  })
}
