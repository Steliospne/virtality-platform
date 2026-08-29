export const ReusableProgramKind = {
  CLINICIAN_OWNED: 'CLINICIAN_OWNED',
  STARTER_TEMPLATE: 'STARTER_TEMPLATE',
} as const

export type ReusableProgramKind =
  (typeof ReusableProgramKind)[keyof typeof ReusableProgramKind]

export type ReusableProgramRecord = {
  id: string
  name: string
  kind: ReusableProgramKind
  userId: string | null
  retiredAt: Date | null
}

export type ReusableProgramExercisePositionInput = {
  id: string
  position: number
}

export type ReusableProgramExerciseCopySource = {
  id: string
  exerciseId: string
  position: number
  sets: number
  reps: number
  restTime: number
  holdTime: number
  speed: number
}

export type ReusableProgramExerciseCopyTarget =
  ReusableProgramExerciseCopySource & {
    reusableProgramId: string
  }

export function buildClinicianOwnedProgramListWhere(userId: string) {
  return {
    userId,
    kind: ReusableProgramKind.CLINICIAN_OWNED,
    retiredAt: null,
  }
}

export function buildStarterTemplateListWhere() {
  return {
    kind: ReusableProgramKind.STARTER_TEMPLATE,
    retiredAt: null,
  }
}

export function isProgramAvailableForTreatment(
  program: ReusableProgramRecord,
): boolean {
  return (
    program.kind === ReusableProgramKind.CLINICIAN_OWNED &&
    program.retiredAt === null
  )
}

export function assertClinicianCanMutateProgram(
  program: ReusableProgramRecord | null | undefined,
  userId: string,
): asserts program is ReusableProgramRecord {
  if (!program) {
    throw new Error('Reusable program not found')
  }

  if (program.kind === ReusableProgramKind.STARTER_TEMPLATE) {
    throw new Error(
      'Starter templates cannot be modified through clinician workflows',
    )
  }

  if (program.userId !== userId) {
    throw new Error('Reusable program is scoped to another clinician')
  }

  if (program.retiredAt) {
    throw new Error('Retired reusable programs cannot be modified')
  }
}

export function validateUniqueExercisePositions(
  exercises: ReusableProgramExercisePositionInput[],
): void {
  const positions = exercises.map((exercise) => exercise.position)
  const uniquePositions = new Set(positions)

  if (uniquePositions.size !== positions.length) {
    throw new Error(
      'Exercise positions must be unique within a reusable program',
    )
  }
}

export function buildRetireProgramData(now: Date = new Date()) {
  return {
    retiredAt: now,
    updatedAt: now,
  }
}

export function buildCopiedProgramName(originalName: string): string {
  const trimmedName = originalName.trim()
  if (trimmedName === '') {
    return 'Untitled program (copy)'
  }

  return `${trimmedName} (copy)`
}

export function buildCopiedProgramExercises(
  exercises: ReusableProgramExerciseCopySource[],
  reusableProgramId: string,
  createExerciseId: () => string,
): ReusableProgramExerciseCopyTarget[] {
  return [...exercises]
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
