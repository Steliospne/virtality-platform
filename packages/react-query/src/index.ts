export { configureORPC, getORPC } from './orpc.js'
export type { ORPCUtils } from './orpc.js'
export { ORPCProvider, useORPC } from './orpc-context.js'
export type { ORPCProviderProps } from './orpc-context.js'

export { getQueryClient, QueryProvider } from './provider.js'
export type { QueryProviderProps } from './provider.js'

// ----------------------- Query hooks -----------------------

// User queries
export { useUserName } from './hooks/queries/user/use-user-name.js'
export { useIsUserVerified } from './hooks/queries/user/use-is-user-verified.js'
export { useUsers } from './hooks/queries/user/use-users.js'

// Preset queries
export { usePreset } from './hooks/queries/preset/use-preset.js'
export { usePresets } from './hooks/queries/preset/use-presets.js'
export { usePresetsByUser } from './hooks/queries/preset/use-preset-by-user.js'

// Avatar queries
export { useAvatar } from './hooks/queries/use-avatar.js'

// Map queries
export { useMap } from './hooks/queries/use-map.js'

// Exercise queries
export { useExercise } from './hooks/queries/use-exercise.js'
export { useExerciseCategories } from './hooks/queries/use-exercise-categories.js'

// Medical history queries
export { useMedicalHistory } from './hooks/queries/use-medical-history.js'

// Supplemental therapy queries
export {
  useSupplementalTherapyQuery,
  useCreateSupplementalTherapyRelMutation,
} from './hooks/queries/use-supplemental-therapy.js'

// Patient queries
export { usePatient } from './hooks/queries/patient/use-patient.js'
export { usePatients } from './hooks/queries/patient/use-patients.js'

// Patient session queries
export { usePatientSession } from './hooks/queries/patient-session/use-patient-session.js'
export { usePatientSessions } from './hooks/queries/patient-session/use-patient-sessions.js'

// Patient program queries
export { usePatientProgram } from './hooks/queries/patient-program/use-patient-program.js'
export { usePatientPrograms } from './hooks/queries/patient-program/use-patient-programs.js'

// Device queries
export { useDeviceCore } from './hooks/queries/use-device.js'

// Waitlist queries
export { useWaitlist } from './hooks/queries/waitlist/use-waitlist.js'

// Referral queries
export { useReferralCodes } from './hooks/queries/referral/use-referral-codes.js'

// Bucket queries
export { useBucket } from './hooks/queries/bucket/use-bucket.js'

// Favorite exercise queries
export { useFavoriteExercise } from './hooks/queries/favorite-exercise/use-favorite-exercise.js'

// ----------------------- Mutation hooks -----------------------

// Program mutations
export { useCreateProgram } from './hooks/mutations/program/use-create-program.js'
export { useUpdateProgram } from './hooks/mutations/program/use-update-program.js'
export { useDeleteProgram } from './hooks/mutations/program/use-delete-program.js'

// Program exercise mutations
export { useCreateProgramExercises } from './hooks/mutations/program-exercise/use-create-program-exercises.js'
export { useUpdateProgramExercises } from './hooks/mutations/program-exercise/use-update-program-exercises.js'

// Preset mutations
export { useCreatePreset } from './hooks/mutations/preset/use-create-preset.js'
export { useUpdatePreset } from './hooks/mutations/preset/use-update-preset.js'
export { useDeletePreset } from './hooks/mutations/preset/use-delete-preset.js'

// Preset exercise mutations`
export { useCreatePresetExercises } from './hooks/mutations/preset-exercise/use-create-preset-exercises.js'
export { useUpdatePresetExercises } from './hooks/mutations/preset-exercise/use-update-preset-exercises.js'

// Patient mutations
export { useNewPatient } from './hooks/mutations/patient/use-new-patient.js'
export { useUpdatePatient } from './hooks/mutations/patient/use-update-patient.js'
export { useDeletePatient } from './hooks/mutations/patient/use-delete-patient.js'

// Patient session mutations
export { useCreatePatientSession } from './hooks/mutations/patient-session/use-create-patient-session.js'
export { useUpdatePatientSession } from './hooks/mutations/patient-session/use-update-patient-session.js'
export { useDeletePatientSession } from './hooks/mutations/patient-session/use-delete-patient-session.js'
export { useCompleteSession } from './hooks/mutations/patient-session/use-complete-session.js'
export { useCreatePatientSessionData } from './hooks/mutations/patient-session-data/use-create-patient-session-data.js'
export { useCreatePatientSessionExercises } from './hooks/mutations/patient-session-exercise/use-create-patient-session-exercises.js'

// Device mutations
export { useSetDeviceId } from './hooks/mutations/device/use-set-device-id.js'
export { useResetDeviceId } from './hooks/mutations/device/use-reset-device-id.js'

// Waitlist mutations
export { useCreateWaitlist } from './hooks/mutations/waitlist/use-create-waitlist.js'

// Referral mutations
export { useCreateReferralCode } from './hooks/mutations/referral/use-create-referral-code.js'
export { useDeleteReferralCode } from './hooks/mutations/referral/use-delete-referral-code.js'

// Email mutations
export { useSendThankYouEmail } from './hooks/mutations/email/use-send-thank-you-email.js'
export {
  useEmailTemplates,
  useEmailTemplate,
  useEmailTemplatePreview,
} from './hooks/queries/email/use-email-templates.js'
export { useSendEmailTemplate } from './hooks/mutations/email/use-send-email-template.js'

// Favorite exercise mutations
export { useAddFavoriteExercise } from './hooks/mutations/favorite-exercise/use-add-favorite-exercise.js'
export { useRemoveFavoriteExercise } from './hooks/mutations/favorite-exercise/use-remove-favorite-exercise.js'
