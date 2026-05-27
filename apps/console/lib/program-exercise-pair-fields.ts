import type { CompleteExercise } from '@/types/models'

const PROGRAM_FIELDS = [
  'reps',
  'sets',
  'restTime',
  'holdTime',
  'speed',
  'romMode',
] as const satisfies readonly (keyof CompleteExercise)[]

export type ProgramExerciseComparableFields = Pick<
  CompleteExercise,
  (typeof PROGRAM_FIELDS)[number]
>

export function programExerciseFieldsDiverge(
  a: ProgramExerciseComparableFields,
  b: ProgramExerciseComparableFields,
): boolean {
  return PROGRAM_FIELDS.some((f) => a[f] !== b[f])
}

/** Apply program field values from `source` onto `target` (used when leaving split mode; primary wins). */
export function copyProgramExerciseFields(
  target: CompleteExercise,
  source: CompleteExercise,
): CompleteExercise {
  return {
    ...target,
    reps: source.reps,
    sets: source.sets,
    restTime: source.restTime,
    holdTime: source.holdTime,
    speed: source.speed,
    romMode: source.romMode,
  }
}
