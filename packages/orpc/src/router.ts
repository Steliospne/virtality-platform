import { me } from './procedures/me.ts'
import { patient } from './procedures/patient.ts'
import { medicalHistory } from './procedures/medical-history.ts'
import { avatar } from './procedures/avatar.ts'
import { map } from './procedures/map.ts'
import { exercise } from './procedures/exercise.ts'
import { patientSession } from './procedures/patient-session.ts'
import { device } from './procedures/device.ts'
import { supplementalTherapy } from './procedures/supplemental-therapy.ts'
import { reusableProgram } from './procedures/reusable-program.ts'
import { reusableProgramExercise } from './procedures/reusable-program-exercise.ts'
import { patientSessionData } from './procedures/patient-session-data.ts'
import { patientSessionExercise } from './procedures/patient-session-exercise.ts'
import { user } from './procedures/user/index.ts'
import { waitlist } from './procedures/waitlist.ts'
import { partnerLogo } from './procedures/partner-logo.ts'
import { highlightCard } from './procedures/highlight-card.ts'
import { blog } from './procedures/blog.ts'
import { promoVideo } from './procedures/promo-video.ts'
import { mosaic } from './procedures/mosaic.ts'
import { email } from './procedures/email.ts'
import { testerCode } from './procedures/tester-code.ts'
import { trialRedeemCode } from './procedures/trial-redeem-code.ts'
import { couponLibrary } from './procedures/coupon-library.ts'
import { promotionCode } from './procedures/promotion-code.ts'
import { campaignWindow } from './procedures/campaign-window.ts'
import { consolePromo } from './procedures/console-promo.ts'
import { consoleAccessCode } from './procedures/console-access-code.ts'
import { consoleBilling } from './procedures/console-billing.ts'
import { renewTrigger } from './procedures/renew-trigger.ts'
import { renewPrompt } from './procedures/renew-prompt.ts'
import { entitlementExtension } from './procedures/entitlement-extension.ts'
import { entitlementClock } from './procedures/entitlement-clock.ts'
import { bucket } from './procedures/bucket.ts'
import { bugReport } from './procedures/bug-report.ts'
import { favoriteExercise } from './procedures/favorite-exercise.ts'
import { dashboard } from './procedures/adminboard/dashboard.ts'
import { adminCustomer } from './procedures/admin-customer.ts'
import { account } from './procedures/account/index.ts'
import { pendingPasswordChange } from './procedures/pending-password-change/index.ts'
import { pendingAccountDeletion } from './procedures/pending-account-deletion/index.ts'
import { devicePairing } from './procedures/device-pairing/index.ts'

export const router = {
  me,
  user,
  pendingPasswordChange,
  pendingAccountDeletion,
  devicePairing,
  patient,
  patientSession,
  medicalHistory,
  avatar,
  map,
  exercise,
  device,
  supplementalTherapy,
  reusableProgram,
  reusableProgramExercise,
  patientSessionData,
  patientSessionExercise,
  waitlist,
  partnerLogo,
  highlightCard,
  blog,
  promoVideo,
  mosaic,
  email,
  testerCode,
  trialRedeemCode,
  couponLibrary,
  promotionCode,
  campaignWindow,
  consolePromo,
  consoleAccessCode,
  consoleBilling,
  renewTrigger,
  renewPrompt,
  entitlementExtension,
  entitlementClock,
  bucket,
  bugReport,
  favoriteExercise,
  dashboard,
  adminCustomer,
  account,
}

export type Router = typeof router
