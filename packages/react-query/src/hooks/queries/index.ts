// ----------------------- Query hooks -----------------------

// User queries
export { useUserName } from './user/use-user-name.js'
export { useIsUserVerified } from './user/use-is-user-verified.js'
export { useUsers } from './user/use-users.js'

// Account queries
export { useListAccounts } from './account/use-list-accounts.js'

// Preset queries
export { usePreset } from './preset/use-preset.js'
export { usePresets } from './preset/use-presets.js'
export { usePresetsByUser } from './preset/use-preset-by-user.js'

// Avatar queries
export { useAvatar } from './use-avatar.js'

// Map queries
export { useMap } from './use-map.js'

// Exercise queries
export { useExercise } from './use-exercise.js'
export { useExerciseCategories } from './use-exercise-categories.js'
export { useExerciseItems } from './use-exercise-items.js'

// Medical history queries
export { useMedicalHistory } from './use-medical-history.js'

// Supplemental therapy queries
export {
  useSupplementalTherapyQuery,
  useCreateSupplementalTherapyRelMutation,
} from './use-supplemental-therapy.js'

// Patient queries
export { usePatient } from './patient/use-patient.js'
export { usePatients } from './patient/use-patients.js'

// Patient session queries
export { usePatientSession } from './patient-session/use-patient-session.js'
export { usePatientSessions } from './patient-session/use-patient-sessions.js'

// Patient program queries
export { usePatientProgram } from './patient-program/use-patient-program.js'
export { usePatientPrograms } from './patient-program/use-patient-programs.js'

// Device queries
export { useDeviceCore } from './use-device.js'

// Waitlist queries
export { useWaitlist } from './waitlist/use-waitlist.js'

// Referral queries
export { useReferralCodes } from './referral/use-referral-codes.js'

// Bucket queries
export { useBucket } from './bucket/use-bucket.js'
export { useBucketObjectReferences } from './bucket/use-bucket-object-references.js'
export { useBucketObjectDetails } from './bucket/use-bucket-object-details.js'
export { useBucketFolderPreview } from './bucket/use-bucket-folder-preview.js'

// Favorite exercise queries
export { useFavoriteExercise } from './favorite-exercise/use-favorite-exercise.js'

// Email queries
export {
  useEmailTemplates,
  useEmailTemplate,
  useEmailTemplatePreview,
} from './email/use-email-templates.js'
export {
  useAdminEmailDrafts,
  useAdminEmailArchivedDrafts,
  useAdminEmailDraft,
  useAdminEmailDraftPreview,
  useAdminEmailSentRecords,
  useAdminEmailSentRecord,
} from './email/use-admin-authored-emails.js'

// Adminboard dashboard queries
export { useTotalUniquePatients } from './adminboard/dashboard/use-total-unique-patients.js'
export { useUniquePatientsPerPhysio } from './adminboard/dashboard/use-unique-patients-per-physio.js'
export { useSessionsPerPatient } from './adminboard/dashboard/use-sessions-per-patient.js'
export { useTotalPatientSessions } from './adminboard/dashboard/use-total-patient-sessions.js'
export { usePatientSessionsPerDatePerUser } from './adminboard/dashboard/use-sessions-per-date-per-user.js'
