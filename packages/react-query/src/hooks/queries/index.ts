// ----------------------- Query hooks -----------------------

// User queries
export { useUserName } from './user/use-user-name.js'
export { useIsUserVerified } from './user/use-is-user-verified.js'
export { useUsers } from './user/use-users.js'
export { useHasPassword } from './user/use-has-password.js'
export {
  useActivePendingPasswordChange,
  type ActivePendingPasswordChange,
} from './user/use-active-pending-password-change.js'

// Account queries
export { useListAccounts } from './account/use-list-accounts.js'

// Reusable program queries
export { useReusableProgram } from './reusable-program/use-reusable-program.js'
export { useReusablePrograms } from './reusable-program/use-reusable-programs.js'
export { useStarterTemplates } from './reusable-program/use-starter-templates.js'

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

// Device queries
export { useDeviceCore } from './use-device.js'

// Waitlist queries
export { useWaitlist } from './waitlist/use-waitlist.js'

// Partner logo queries
export { usePartnerLogos } from './partner-logo/use-partner-logos.js'

// Promo video queries
export { usePromoVideo } from './promo-video/use-promo-video.js'
// Mosaic queries
export { useMosaic } from './mosaic/use-mosaic.js'

// Highlight card queries
export { useHighlightCards } from './highlight-card/use-highlight-cards.js'

// Blog queries
export {
  useBlogAuthors,
  useBlogPost,
  useBlogPosts,
  usePublishedBlogPosts,
} from './blog/use-blog-queries.js'

// Tester Code queries
export { useTesterCodes } from './tester-code/use-tester-codes.js'

// Trial Redeem Code queries
export { useTrialRedeemCodes } from './trial-redeem-code/use-trial-redeem-codes.js'

// Coupon library queries
export { useLibraryCoupons } from './coupon-library/use-library-coupons.js'

// Promotion Code queries
export { usePromotionCodes } from './promotion-code/use-promotion-codes.js'

// Entitlement Extension queries
export { useExtendableSeats } from './entitlement-extension/use-extendable-seats.js'

// Entitlement Clock queries
export { useEntitlementStanding } from './entitlement-clock/use-entitlement-standing.js'

// Renew trigger queries
export { useRenewTriggers } from './renew-trigger/use-renew-triggers.js'

// Renew prompt queries
export { useInAppRenewPrompts } from './renew-prompt/use-in-app-renew-prompts.js'

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
export { useEffectivenessReport } from './adminboard/dashboard/use-effectiveness-report.js'
