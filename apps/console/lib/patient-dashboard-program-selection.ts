import type { ReusableProgramExercise } from '@virtality/db'
import type { CompleteExercise, CompleteReusableProgram } from '@/types/models'

export type DashboardReusableProgram = CompleteReusableProgram

export function reusableProgramExercisesToSessionCopy(
  exercises: ReusableProgramExercise[],
): CompleteExercise[] {
  return exercises.map((exercise) => ({
    id: exercise.id,
    exerciseId: exercise.exerciseId,
    sets: exercise.sets,
    reps: exercise.reps,
    restTime: exercise.restTime,
    holdTime: exercise.holdTime,
    speed: exercise.speed,
    romMode: 0 as const,
  }))
}

export function resolveLastUsedProgram(
  programs: DashboardReusableProgram[] | undefined,
  lastProgramId: string | undefined,
): DashboardReusableProgram | null {
  if (!programs || !lastProgramId) return null
  return programs.find((program) => program.id === lastProgramId) ?? null
}

export function orderProgramsForDashboardSelection<
  T extends Pick<DashboardReusableProgram, 'id' | 'updatedAt'>,
>(programs: T[], lastProgramId: string | undefined): T[] {
  if (!lastProgramId) return programs

  const lastUsed = programs.find((program) => program.id === lastProgramId)
  if (!lastUsed) return programs

  return [
    lastUsed,
    ...programs.filter((program) => program.id !== lastProgramId),
  ]
}

export function buildProgramSelectionState(
  program: DashboardReusableProgram,
  activeExerciseData: {
    currentRep: number
    currentSet: number
    totalReps: number
    totalSets: number
    id: string | null
  },
) {
  const sessionExercises = reusableProgramExercisesToSessionCopy(
    program.exercises,
  )
  const firstExercise = sessionExercises[0]

  return {
    selectedProgram: program,
    exercises: sessionExercises,
    activeExerciseData: {
      ...activeExerciseData,
      id: firstExercise ? firstExercise.exerciseId : null,
      totalReps: firstExercise ? firstExercise.reps : 0,
      totalSets: firstExercise ? firstExercise.sets : 0,
    },
  }
}

export function isSessionCopyIsolatedFromLibrary(
  libraryExercises: ReusableProgramExercise[],
  sessionExercises: CompleteExercise[],
): boolean {
  if (libraryExercises.length !== sessionExercises.length) return false

  return libraryExercises.every((libraryExercise, index) => {
    const sessionExercise = sessionExercises[index]
    if (!sessionExercise) return false

    return (
      libraryExercise.id === sessionExercise.id &&
      libraryExercise.exerciseId === sessionExercise.exerciseId &&
      libraryExercise.sets === sessionExercise.sets &&
      libraryExercise.reps === sessionExercise.reps &&
      libraryExercise.restTime === sessionExercise.restTime &&
      libraryExercise.holdTime === sessionExercise.holdTime &&
      libraryExercise.speed === sessionExercise.speed
    )
  })
}
