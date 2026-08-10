import { me } from './procedures/me.ts'
import { patient } from './procedures/patient.ts'
import { medicalHistory } from './procedures/medical-history.ts'
import { avatar } from './procedures/avatar.ts'
import { map } from './procedures/map.ts'
import { exercise } from './procedures/exercise.ts'
import { patientSession } from './procedures/patient-session.ts'
import { device } from './procedures/device.ts'
import { supplementalTherapy } from './procedures/supplemental-therapy.ts'
import { legacy } from './procedures/legacy/index.ts'
import { reusableProgram } from './procedures/reusable-program.ts'
import { reusableProgramExercise } from './procedures/reusable-program-exercise.ts'
import { patientSessionData } from './procedures/patient-session-data.ts'
import { patientSessionExercise } from './procedures/patient-session-exercise.ts'
import { user } from './procedures/user/index.ts'
import { waitlist } from './procedures/waitlist.ts'
import { partnerLogo } from './procedures/partner-logo.ts'
import { highlightCard } from './procedures/highlight-card.ts'
import { promoVideo } from './procedures/promo-video.ts'
import { mosaic } from './procedures/mosaic.ts'
import { email } from './procedures/email.ts'
import { testerCode } from './procedures/tester-code.ts'
import { trialRedeemCode } from './procedures/trial-redeem-code.ts'
import { bucket } from './procedures/bucket.ts'
import { favoriteExercise } from './procedures/favorite-exercise.ts'
import { dashboard } from './procedures/adminboard/dashboard.ts'
import { account } from './procedures/account/index.ts'
import { pendingPasswordChange } from './procedures/pending-password-change/index.ts'
import { devicePairing } from './procedures/device-pairing/index.ts'

export const router = {
  me,
  user,
  pendingPasswordChange,
  devicePairing,
  patient,
  patientSession,
  medicalHistory,
  avatar,
  map,
  exercise,
  device,
  supplementalTherapy,
  legacy,
  reusableProgram,
  reusableProgramExercise,
  patientSessionData,
  patientSessionExercise,
  waitlist,
  partnerLogo,
  highlightCard,
  promoVideo,
  mosaic,
  email,
  testerCode,
  trialRedeemCode,
  bucket,
  favoriteExercise,
  dashboard,
  account,
}

export type Router = typeof router
