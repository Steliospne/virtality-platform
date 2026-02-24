import { me } from './procedures/me.ts'
import { patient } from './procedures/patient.ts'
import { medicalHistory } from './procedures/medical-history.ts'
import { avatar } from './procedures/avatar.ts'
import { map } from './procedures/map.ts'
import { exercise } from './procedures/exercise.ts'
import { patientSession } from './procedures/patient-session.ts'
import { device } from './procedures/device.ts'
import { supplementalTherapy } from './procedures/supplemental-therapy.ts'
import { program } from './procedures/program.ts'
import { programExercise } from './procedures/program-exercise.ts'
import { preset } from './procedures/preset.ts'
import { presetExercise } from './procedures/preset-exercise.ts'
import { patientSessionData } from './procedures/patient-session-data.ts'
import { patientSessionExercise } from './procedures/patient-session-exercise.ts'
import { user } from './procedures/user.ts'

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
  program,
  programExercise,
  preset,
  presetExercise,
  patientSessionData,
  patientSessionExercise,
}
