/**
 * Legacy patient-program and preset React Query hooks.
 *
 * Import from `@virtality/react-query/legacy` only for adminboard or migration
 * tooling. Clinician-facing console flows must use reusable program hooks from
 * the main `@virtality/react-query` entry.
 */
export { usePreset } from '../hooks/queries/preset/use-preset.js'
export { usePresets } from '../hooks/queries/preset/use-presets.js'
export { usePresetsByUser } from '../hooks/queries/preset/use-preset-by-user.js'
export { usePatientProgram } from '../hooks/queries/patient-program/use-patient-program.js'
export { usePatientPrograms } from '../hooks/queries/patient-program/use-patient-programs.js'

export { useCreateProgram } from '../hooks/mutations/program/use-create-program.js'
export { useUpdateProgram } from '../hooks/mutations/program/use-update-program.js'
export { useDeleteProgram } from '../hooks/mutations/program/use-delete-program.js'
export { useCreateProgramExercises } from '../hooks/mutations/program-exercise/use-create-program-exercises.js'
export { useUpdateProgramExercises } from '../hooks/mutations/program-exercise/use-update-program-exercises.js'

export { useCreatePreset } from '../hooks/mutations/preset/use-create-preset.js'
export { useUpdatePreset } from '../hooks/mutations/preset/use-update-preset.js'
export { useDeletePreset } from '../hooks/mutations/preset/use-delete-preset.js'
export { useCreatePresetExercises } from '../hooks/mutations/preset-exercise/use-create-preset-exercises.js'
export { useUpdatePresetExercises } from '../hooks/mutations/preset-exercise/use-update-preset-exercises.js'
