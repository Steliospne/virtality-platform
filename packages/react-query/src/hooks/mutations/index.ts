// ----------------------- Mutation hooks -----------------------

// User mutations
export { useUpdateUserInfo } from './user/use-update-user-info.js'
export { useUpdateUserEmail } from './user/use-update-user-email.ts'
export { useStartPasswordSetup } from './user/use-start-password-setup.js'
export { useStartPasswordChange } from './user/use-start-password-change.js'
export { useResendPendingPasswordChange } from './user/use-resend-pending-password-change.js'
export { useCancelPendingPasswordChange } from './user/use-cancel-pending-password-change.js'
export { useInspectPendingPasswordChange } from './user/use-inspect-pending-password-change.js'
export { useApprovePendingPasswordChange } from './user/use-approve-pending-password-change.js'
export { useStartAccountDeletion } from './user/use-start-account-deletion.js'
export { useResendPendingAccountDeletion } from './user/use-resend-pending-account-deletion.js'
export { useCancelPendingAccountDeletion } from './user/use-cancel-pending-account-deletion.js'
export { useInspectPendingAccountDeletion } from './user/use-inspect-pending-account-deletion.js'
export { useApprovePendingAccountDeletion } from './user/use-approve-pending-account-deletion.js'

// Reusable program mutations
export { useCreateReusableProgram } from './reusable-program/use-create-reusable-program.js'
export { useUpdateReusableProgram } from './reusable-program/use-update-reusable-program.js'
export { useRetireReusableProgram } from './reusable-program/use-retire-reusable-program.js'
export { useCopyReusableProgram } from './reusable-program/use-copy-reusable-program.js'

// Reusable program exercise mutations
export { useCreateReusableProgramExercises } from './reusable-program-exercise/use-create-reusable-program-exercises.js'
export { useUpdateReusableProgramExercises } from './reusable-program-exercise/use-update-reusable-program-exercises.js'

// Patient mutations
export { useNewPatient } from './patient/use-new-patient.js'
export { useUpdatePatient } from './patient/use-update-patient.js'
export { useDeletePatient } from './patient/use-delete-patient.js'

// Patient session mutations
export { useCreatePatientSession } from './patient-session/use-create-patient-session.js'
export { useStartPatientSessionFromAck } from './patient-session/use-start-patient-session-from-ack.js'
export { useUpdatePatientSession } from './patient-session/use-update-patient-session.js'
export { useDeletePatientSession } from './patient-session/use-delete-patient-session.js'
export { useCompleteSession } from './patient-session/use-complete-session.js'
export { useInterruptPatientSession } from './patient-session/use-interrupt-patient-session.js'
export { useSyncSessionWorkingCopy } from './patient-session/use-sync-session-working-copy.js'
export { useCreatePatientSessionData } from './patient-session-data/use-create-patient-session-data.js'
export { useUpsertPatientSessionData } from './patient-session-data/use-upsert-patient-session-data.js'
export { useCreatePatientSessionExercises } from './patient-session-exercise/use-create-patient-session-exercises.js'

// Device mutations
export { useResetDeviceId } from './device/use-reset-device-id.js'

// Waitlist mutations
export { useCreateWaitlist } from './waitlist/use-create-waitlist.js'

// Tester Code mutations
export { useCreateTesterCode } from './tester-code/use-create-tester-code.js'
export { useDeleteTesterCode } from './tester-code/use-delete-tester-code.js'

// Access Code mutations
export { useCreateTrialRedeemCode } from './trial-redeem-code/use-create-trial-redeem-code.js'
export { useDeleteTrialRedeemCode } from './trial-redeem-code/use-delete-trial-redeem-code.js'
export { useSendTrialRedeemCodeEmail } from './trial-redeem-code/use-send-trial-redeem-code-email.js'

// Coupon library mutations
export { useCreateLibraryCoupon } from './coupon-library/use-create-library-coupon.js'
export { useUpdateLibraryCouponName } from './coupon-library/use-update-library-coupon-name.js'
export { useArchiveLibraryCoupon } from './coupon-library/use-archive-library-coupon.js'
export { useDeleteLibraryCoupon } from './coupon-library/use-delete-library-coupon.js'

// Promotion Code mutations
export { useCreatePromotionCode } from './promotion-code/use-create-promotion-code.js'
export { useDeactivatePromotionCode } from './promotion-code/use-deactivate-promotion-code.js'
export { useSendPromotionCodeEmail } from './promotion-code/use-send-promotion-code-email.js'
export { useNotifyPromotionCodeInApp } from './promotion-code/use-notify-promotion-code-in-app.js'

// Campaign Window mutations
export { useUpsertCampaignWindow } from './campaign-window/use-upsert-campaign-window.js'
export { useCloseCampaignWindow } from './campaign-window/use-close-campaign-window.js'

// Console promo / Billing Discount mutations
export { useRedeemPromotionCode } from './console-promo/use-redeem-promotion-code.js'
export { useRedeemAccessCode } from './console-access-code/use-redeem-access-code.js'
export { useSavePendingPromotionCode } from './console-promo/use-save-pending-promotion-code.js'
export { useCancelPendingPromotionCode } from './console-promo/use-cancel-pending-promotion-code.js'
export { useRemovePromoDiscount } from './console-promo/use-remove-promo-discount.js'
export { useScheduleConsoleCyclePlanChange } from './console-billing/use-schedule-console-cycle-plan-change.js'
export { useStartConsoleSubscribeCheckout } from './console-billing/use-start-console-subscribe-checkout.js'

// Entitlement Extension mutations
export { useExtendEntitlementClock } from './entitlement-extension/use-extend-entitlement-clock.js'

// Admin customer mutations
export {
  useAdjustTrialGrant,
  useAssignPermanentFree,
  useIssueTrialGrant,
  useRevokeTrialGrant,
} from './admin-customer/use-admin-customer-access-mutations.js'
export {
  useAssignableProVariants,
  useAssignProVariant,
} from './admin-customer/use-admin-customer-assigned-variant.js'
export {
  useAssignFreeAfterCancellation,
  useCancelCyclePlanChange,
  useCancelPaidSubscription,
  useChangePaidPlan,
  usePreviewChangePaidPlan,
  useReactivatePaidSubscription,
  useSendPaidCheckoutLink,
} from './admin-customer/use-admin-customer-billing-mutations.js'

// Renew trigger mutations
export { useCreateRenewTrigger } from './renew-trigger/use-create-renew-trigger.js'
export { useUpdateRenewTrigger } from './renew-trigger/use-update-renew-trigger.js'
export { useRemoveRenewTrigger } from './renew-trigger/use-remove-renew-trigger.js'

// Renew prompt mutations
export { useEvaluateRenewPrompts } from './renew-prompt/use-evaluate-renew-prompts.js'

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

// Partner logo mutations
export { useCreatePartnerLogo } from './partner-logo/use-create-partner-logo.js'
export { useUpdatePartnerLogo } from './partner-logo/use-update-partner-logo.js'
export { useReorderPartnerLogo } from './partner-logo/use-reorder-partner-logo.js'
export { useRemovePartnerLogo } from './partner-logo/use-remove-partner-logo.js'

// Promo video mutations
export { useAssignPromoVideo } from './promo-video/use-assign-promo-video.js'
export { useClearPromoVideo } from './promo-video/use-clear-promo-video.js'

// Mosaic mutations
export { useSaveMosaic } from './mosaic/use-save-mosaic.js'

// Highlight card mutations
export { useCreateHighlightCard } from './highlight-card/use-create-highlight-card.js'
export { useUpdateHighlightCard } from './highlight-card/use-update-highlight-card.js'
export { useReorderHighlightCard } from './highlight-card/use-reorder-highlight-card.js'
export { useRemoveHighlightCard } from './highlight-card/use-remove-highlight-card.js'

// Blog mutations
export {
  useArchiveBlogPost,
  useAutosaveBlogPost,
  useCreateBlogDraft,
  useDiscardBlogPostChanges,
  usePublishBlogPost,
  useRestoreBlogPost,
  useSetBlogPostFeatured,
  useUnpublishBlogPost,
} from './blog/use-blog-mutations.js'

// Bucket mutations
export { useUploadBucketObjects } from './bucket/use-upload-bucket-objects.js'
export { useMoveBucketObject } from './bucket/use-move-bucket-object.js'
export { useDeleteBucketObject } from './bucket/use-delete-bucket-object.js'
export { useReplaceBucketObject } from './bucket/use-replace-bucket-object.js'
export { useMoveBucketFolder } from './bucket/use-move-bucket-folder.js'
export { useDeleteBucketFolder } from './bucket/use-delete-bucket-folder.js'
