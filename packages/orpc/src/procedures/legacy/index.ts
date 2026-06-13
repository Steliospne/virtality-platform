/**
 * Pre–Reusable Program API retained for adminboard Starter Template management
 * and migration tooling only. Clinician-facing console flows must use
 * `reusableProgram` / `reusableProgramExercise` instead.
 */
import { program } from '../program.ts'
import { programExercise } from '../program-exercise.ts'
import { preset } from '../preset.ts'
import { presetExercise } from '../preset-exercise.ts'

export const legacy = {
  program,
  programExercise,
  preset,
  presetExercise,
}
