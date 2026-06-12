// ----------------------- Mutation hooks -----------------------

// User mutations
export { useUpdateUserInfo } from './user/use-update-user-info.js'
export { useUpdateUserEmail } from './user/use-update-user-email.ts'

// Program mutations
export { useCreateProgram } from './program/use-create-program.js'
export { useUpdateProgram } from './program/use-update-program.js'
export { useDeleteProgram } from './program/use-delete-program.js'

// Program exercise mutations
export { useCreateProgramExercises } from './program-exercise/use-create-program-exercises.js'
export { useUpdateProgramExercises } from './program-exercise/use-update-program-exercises.js'

// Preset mutations
export { useCreatePreset } from './preset/use-create-preset.js'
export { useUpdatePreset } from './preset/use-update-preset.js'
export { useDeletePreset } from './preset/use-delete-preset.js'

// Preset exercise mutations`
export { useCreatePresetExercises } from './preset-exercise/use-create-preset-exercises.js'
export { useUpdatePresetExercises } from './preset-exercise/use-update-preset-exercises.js'

// Patient mutations
export { useNewPatient } from './patient/use-new-patient.js'
export { useUpdatePatient } from './patient/use-update-patient.js'
export { useDeletePatient } from './patient/use-delete-patient.js'

// Patient session mutations
export { useCreatePatientSession } from './patient-session/use-create-patient-session.js'
export { useUpdatePatientSession } from './patient-session/use-update-patient-session.js'
export { useDeletePatientSession } from './patient-session/use-delete-patient-session.js'
export { useCompleteSession } from './patient-session/use-complete-session.js'
export { useCreatePatientSessionData } from './patient-session-data/use-create-patient-session-data.js'
export { useCreatePatientSessionExercises } from './patient-session-exercise/use-create-patient-session-exercises.js'

// Device mutations
export { useSetDeviceId } from './device/use-set-device-id.js'
export { useResetDeviceId } from './device/use-reset-device-id.js'

// Waitlist mutations
export { useCreateWaitlist } from './waitlist/use-create-waitlist.js'

// Referral mutations
export { useCreateReferralCode } from './referral/use-create-referral-code.js'
export { useDeleteReferralCode } from './referral/use-delete-referral-code.js'

// Email mutations
export { useSendThankYouEmail } from './email/use-send-thank-you-email.js'
export { useSendEmailTemplate } from './email/use-send-email-template.js'
export {
  useCreateAdminEmailDraft,
  useUpdateAdminEmailDraft,
  useCloneAdminEmailDraft,
  useCloneAdminEmailFromSent,
  useArchiveAdminEmailDraft,
  useRestoreAdminEmailDraft,
  useTestSendAdminEmailDraft,
  useFinalSendAdminEmailDraft,
} from './email/use-admin-authored-email-mutations.js'

// Favorite exercise mutations
export { useAddFavoriteExercise } from './favorite-exercise/use-add-favorite-exercise.js'
export { useRemoveFavoriteExercise } from './favorite-exercise/use-remove-favorite-exercise.js'

// Bucket mutations
export { useUploadBucketObjects } from './bucket/use-upload-bucket-objects.js'
export { useMoveBucketObject } from './bucket/use-move-bucket-object.js'
export { useDeleteBucketObject } from './bucket/use-delete-bucket-object.js'
export { useReplaceBucketObject } from './bucket/use-replace-bucket-object.js'
export { useMoveBucketFolder } from './bucket/use-move-bucket-folder.js'
export { useDeleteBucketFolder } from './bucket/use-delete-bucket-folder.js'
