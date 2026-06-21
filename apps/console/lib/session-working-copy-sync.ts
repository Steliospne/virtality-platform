import type { CompleteExercise } from '@/types/models'
import {
  buildCompletionSessionExerciseRows,
  type SessionWorkingCopyExercise,
} from '@virtality/shared/utils'
import type { DashboardProgramState } from './patient-dashboard-session-launch'

export function toSessionWorkingCopyExercises(
  exercises: readonly CompleteExercise[],
): SessionWorkingCopyExercise[] {
  return exercises.map((exercise) => ({
    exerciseId: exercise.exerciseId,
    sets: exercise.sets,
    reps: exercise.reps,
    restTime: exercise.restTime,
    holdTime: exercise.holdTime,
    speed: exercise.speed,
  }))
}

export function shouldPersistSessionWorkingCopy(
  programState: DashboardProgramState,
  patientSessionId: string | undefined,
  exercises: readonly CompleteExercise[] | undefined,
): boolean {
  if (programState !== 'started' && programState !== 'paused') {
    return false
  }

  if (!patientSessionId) {
    return false
  }

  return Boolean(exercises?.length)
}

export function serializeSessionWorkingCopy(
  exercises: readonly CompleteExercise[],
): string {
  return JSON.stringify(toSessionWorkingCopyExercises(exercises))
}

export function buildSessionWorkingCopySyncPayload(input: {
  sessionId: string
  exercises: readonly CompleteExercise[]
  persistedRows: ReadonlyArray<{ id: string; exerciseId: string }>
  createId: () => string
}) {
  return {
    id: input.sessionId,
    exercises: buildCompletionSessionExerciseRows(
      toSessionWorkingCopyExercises(input.exercises),
      input.persistedRows,
      input.createId,
    ),
  }
}
