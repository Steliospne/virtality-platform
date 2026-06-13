export type SessionExerciseSettings = {
  sets: number
  reps: number
  holdTime: number
  speed: number
}

const roundOneDecimal = (value: number): number => Math.round(value * 10) / 10

/** Dose: sets * reps * holdTime * speed per SessionExercise. */
export function getExerciseTherapyDose(
  exercise: SessionExerciseSettings,
): number {
  return exercise.sets * exercise.reps * exercise.holdTime * exercise.speed
}

/** Session-level therapy dose from completed session exercise settings. */
export function getSessionTherapyDose(
  sessionExercises: SessionExerciseSettings[],
): number | null {
  if (sessionExercises.length === 0) {
    return null
  }

  return sessionExercises.reduce(
    (sum, exercise) => sum + getExerciseTherapyDose(exercise),
    0,
  )
}

/** Session duration in minutes from createdAt to completedAt. */
export function getSessionDurationMinutes(
  createdAt: string,
  completedAt: string,
): number | null {
  const start = new Date(createdAt).getTime()
  const end = new Date(completedAt).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null
  }

  return roundOneDecimal((end - start) / 60_000)
}
