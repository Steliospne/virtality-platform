import type { PatientSessionStatus } from '@virtality/db'
import type { CompleteExercise, CompleteReusableProgram } from '@/types/models'
import { generateUUID } from '@virtality/shared/utils'

export type DashboardProgramState = 'ready' | 'launching' | 'started' | 'paused'

export type SourceProgramContext = {
  sourceReusableProgramId: string | null
  sourceProgramName: string | null
}

export type SessionExerciseRowInput = {
  id: string
  patientSessionId: string
  exerciseId: string
  position: number
  sets: number
  reps: number
  restTime: number
  holdTime: number
  speed: number
}

export type StartedSessionInput = {
  id: string
  patientId: string
  programId: null
  status: PatientSessionStatus
  sourceReusableProgramId: string | null
  sourceProgramName: string | null
  nprs: null
  notes: null
  createdAt: Date
  completedAt: null
  deletedAt: null
}

export function resolveSourceProgramContext(
  inQuickStart: boolean,
  selectedProgram: Pick<CompleteReusableProgram, 'id' | 'name'> | null,
): SourceProgramContext {
  if (inQuickStart || !selectedProgram) {
    return {
      sourceReusableProgramId: null,
      sourceProgramName: null,
    }
  }

  return {
    sourceReusableProgramId: selectedProgram.id,
    sourceProgramName: selectedProgram.name,
  }
}

export function buildStartedSessionInput({
  sessionId,
  patientId,
  source,
}: {
  sessionId: string
  patientId: string
  source: SourceProgramContext
}): StartedSessionInput {
  return {
    id: sessionId,
    patientId,
    programId: null,
    status: 'ACTIVE',
    sourceReusableProgramId: source.sourceReusableProgramId,
    sourceProgramName: source.sourceProgramName,
    nprs: null,
    notes: null,
    createdAt: new Date(),
    completedAt: null,
    deletedAt: null,
  }
}

export function buildSessionExerciseRowsFromWorkingCopy(
  exercises: CompleteExercise[],
  patientSessionId: string,
  createId: () => string = generateUUID,
): SessionExerciseRowInput[] {
  return exercises.map((exercise, position) => ({
    id: createId(),
    patientSessionId,
    exerciseId: exercise.exerciseId,
    position,
    sets: exercise.sets,
    reps: exercise.reps,
    restTime: exercise.restTime,
    holdTime: exercise.holdTime,
    speed: exercise.speed,
  }))
}

export function canPersistSessionProgress(
  patientSessionId: string | undefined,
  sessionExerciseRows: ReadonlyArray<{ exerciseId: string }> | undefined,
  exerciseIndex: number,
): boolean {
  if (!patientSessionId) return false
  if (!sessionExerciseRows?.length) return false
  if (exerciseIndex < 0 || exerciseIndex >= sessionExerciseRows.length) {
    return false
  }

  return Boolean(sessionExerciseRows[exerciseIndex]?.exerciseId)
}

export function shouldCreatePatientSessionOnStartAck(
  programState: DashboardProgramState,
): boolean {
  return programState === 'launching'
}

export type StartAckPersistenceInput = {
  sessionId: string
  session: StartedSessionInput
  exercises: SessionExerciseRowInput[]
}

export function buildStartAckPersistenceInput({
  programState,
  exercises,
  patientId,
  inQuickStart,
  selectedProgram,
  createId = generateUUID,
}: {
  programState: DashboardProgramState
  exercises: CompleteExercise[] | undefined
  patientId: string
  inQuickStart: boolean
  selectedProgram: Pick<CompleteReusableProgram, 'id' | 'name'> | null
  createId?: () => string
}): StartAckPersistenceInput | null {
  if (!shouldCreatePatientSessionOnStartAck(programState)) {
    return null
  }

  if (!exercises?.length) {
    return null
  }

  const sessionId = createId()
  const source = resolveSourceProgramContext(inQuickStart, selectedProgram)
  const rows = buildSessionExerciseRowsFromWorkingCopy(
    exercises,
    sessionId,
    createId,
  )

  return {
    sessionId,
    session: buildStartedSessionInput({
      sessionId,
      patientId,
      source,
    }),
    exercises: rows,
  }
}

export function resolveProgramStateAfterStartAckPersistenceFailure(): DashboardProgramState {
  return 'ready'
}

export function resolveProgramStateAfterStartAckPersistenceSuccess(): DashboardProgramState {
  return 'started'
}
