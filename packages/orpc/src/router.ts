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
import { email } from './procedures/email.ts'
import { referral } from './procedures/referral.ts'
import { bucket } from './procedures/bucket.ts'
import { favoriteExercise } from './procedures/favorite-exercise.ts'
import { dashboard } from './procedures/adminboard/dashboard.ts'
import { account } from './procedures/account/index.ts'

export const router = {
  me,
  user,
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
  email,
  referral,
  bucket,
  favoriteExercise,
  dashboard,
  account,
}

export type Router = typeof router
