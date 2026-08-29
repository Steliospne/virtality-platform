import {
  ReusableProgramKind,
  type ReusableProgramExerciseCopyTarget,
  type ReusableProgramRecord,
} from './reusable-program.ts'

export const SessionCompletionSaveChoice = {
  FINISH_ONLY: 'FINISH_ONLY',
  UPDATE_SOURCE_PROGRAM: 'UPDATE_SOURCE_PROGRAM',
  SAVE_AS_NEW_PROGRAM: 'SAVE_AS_NEW_PROGRAM',
} as const

export type SessionCompletionSaveChoice =
  (typeof SessionCompletionSaveChoice)[keyof typeof SessionCompletionSaveChoice]

export type SessionExerciseSnapshotRow = {
  id: string
  exerciseId: string
  position: number
  sets: number
  reps: number
  restTime: number
  holdTime: number
  speed: number
}

export type SessionWorkingCopyExercise = {
  exerciseId: string
  sets: number
  reps: number
  restTime: number
  holdTime: number
  speed: number
}

export type SessionCompletionSession = {
  sourceReusableProgramId: string | null
  sourceProgramName: string | null
}

export function assertSessionCanBeCompleted(status: string): void {
  if (status !== 'ACTIVE') {
    throw new Error('Only active sessions can be completed')
  }
}

export function assertSessionExerciseRowsMutable(status: string): void {
  if (status !== 'ACTIVE') {
    throw new Error(
      'Session exercise rows cannot be modified once the session is no longer active',
    )
  }
}

export function canOfferUpdateSourceProgram(
  session: SessionCompletionSession,
  sourceProgram: ReusableProgramRecord | null | undefined,
  clinicianUserId: string,
): boolean {
  if (!session.sourceReusableProgramId || !sourceProgram) {
    return false
  }

  if (sourceProgram.id !== session.sourceReusableProgramId) {
    return false
  }

  return (
    sourceProgram.kind === ReusableProgramKind.CLINICIAN_OWNED &&
    sourceProgram.userId === clinicianUserId &&
    sourceProgram.retiredAt === null
  )
}

export function buildSaveAsNewProgramName(
  sourceProgramName: string | null | undefined,
): string {
  const trimmedName = sourceProgramName?.trim()
  if (trimmedName) {
    return `${trimmedName} (session)`
  }

  return 'Session program'
}

export function buildCompletionSessionExerciseRows(
  workingCopy: readonly SessionWorkingCopyExercise[],
  persistedRows: ReadonlyArray<{ id: string; exerciseId: string }>,
  createId: () => string,
): SessionExerciseSnapshotRow[] {
  return workingCopy.map((exercise, position) => {
    const persistedRow = persistedRows[position]

    return {
      id: persistedRow?.id ?? createId(),
      exerciseId: exercise.exerciseId,
      position,
      sets: exercise.sets,
      reps: exercise.reps,
      restTime: exercise.restTime,
      holdTime: exercise.holdTime,
      speed: exercise.speed,
    }
  })
}

export function mapSessionExercisesToReusableProgramExercises(
  sessionExercises: readonly SessionExerciseSnapshotRow[],
  reusableProgramId: string,
  createExerciseId: () => string,
): ReusableProgramExerciseCopyTarget[] {
  return [...sessionExercises]
    .sort((left, right) => left.position - right.position)
    .map((exercise) => ({
      id: createExerciseId(),
      reusableProgramId,
      exerciseId: exercise.exerciseId,
      position: exercise.position,
      sets: exercise.sets,
      reps: exercise.reps,
      restTime: exercise.restTime,
      holdTime: exercise.holdTime,
      speed: exercise.speed,
    }))
}

export function assertCompletionSaveChoiceAllowed(
  saveChoice: SessionCompletionSaveChoice,
  session: SessionCompletionSession,
  sourceProgram: ReusableProgramRecord | null | undefined,
  clinicianUserId: string,
  exerciseCount: number,
  newProgramName?: string,
): void {
  if (exerciseCount === 0) {
    throw new Error('At least one exercise is required to complete a session')
  }

  if (
    saveChoice === SessionCompletionSaveChoice.UPDATE_SOURCE_PROGRAM &&
    !canOfferUpdateSourceProgram(session, sourceProgram, clinicianUserId)
  ) {
    throw new Error('This session cannot update the source reusable program')
  }

  if (saveChoice === SessionCompletionSaveChoice.SAVE_AS_NEW_PROGRAM) {
    const trimmedName = newProgramName?.trim()
    if (!trimmedName) {
      throw new Error('Program name is required when saving as a new program')
    }
  }
}
