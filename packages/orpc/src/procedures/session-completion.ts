import {
  SessionCompletionSaveChoice,
  assertCompletionSaveChoiceAllowed,
  assertSessionCanBeCompleted,
  buildSaveAsNewProgramName,
  diffById,
  generateUUID,
  mapSessionExercisesToReusableProgramExercises,
  validateUniqueExercisePositions,
  type ReusableProgramExerciseCopyTarget,
  type ReusableProgramRecord,
  type SessionExerciseSnapshotRow,
} from '@virtality/shared/utils'
import { ORPCError } from '@orpc/server'

type SessionExercisePersistRow = SessionExerciseSnapshotRow & {
  patientSessionId: string
}

type SessionExerciseDelegate = {
  findMany: (args: {
    where: { patientSessionId: string }
    orderBy: { position: 'asc' }
  }) => Promise<SessionExerciseSnapshotRow[]>
  deleteMany: (args: { where: { id: { in: string[] } } }) => Promise<unknown>
  createMany: (args: { data: SessionExercisePersistRow[] }) => Promise<unknown>
  update: (args: {
    where: { id: string }
    data: Omit<SessionExercisePersistRow, 'id'>
  }) => Promise<unknown>
}

type ReusableProgramExerciseDelegate = {
  findMany: (args: {
    where: { reusableProgramId: string }
  }) => Promise<ReusableProgramExerciseCopyTarget[]>
  deleteMany: (args: { where: { id: { in: string[] } } }) => Promise<unknown>
  createMany: (args: {
    data: ReusableProgramExerciseCopyTarget[]
  }) => Promise<unknown>
  update: (args: {
    where: { id: string }
    data: ReusableProgramExerciseCopyTarget
  }) => Promise<unknown>
}

type PatientSessionDelegate = {
  findFirst: (args: {
    where: { id: string; deletedAt: null }
    include: {
      sessionExercise: { orderBy: { position: 'asc' } }
    }
  }) => Promise<{
    id: string
    status: string
    sourceReusableProgramId: string | null
    sourceProgramName: string | null
    sessionExercise: SessionExerciseSnapshotRow[]
  } | null>
  update: (args: {
    where: { id: string }
    data: {
      status: 'COMPLETED'
      completedAt: Date
      notes?: string | null
    }
  }) => Promise<{
    id: string
    status: string
    sourceProgramName: string | null
    completedAt: Date | null
  }>
}

type ReusableProgramDelegate = {
  findFirst: (args: {
    where: { id: string }
  }) => Promise<ReusableProgramRecord | null>
  create: (args: {
    data: {
      id: string
      name: string
      kind: 'CLINICIAN_OWNED'
      userId: string
      createdAt: Date
      updatedAt: Date
      retiredAt: null
    }
  }) => Promise<unknown>
  update: (args: {
    where: { id: string }
    data: { updatedAt: Date }
  }) => Promise<unknown>
}

export type CompletePatientSessionInput = {
  id: string
  saveChoice: SessionCompletionSaveChoice
  newProgramName?: string
  notes?: string | null
  exercises?: SessionExerciseSnapshotRow[]
}

export type CompletePatientSessionDeps = {
  patientSession: PatientSessionDelegate
  sessionExercise: SessionExerciseDelegate
  reusableProgram: ReusableProgramDelegate
  reusableProgramExercise: ReusableProgramExerciseDelegate
  now?: Date
  createId?: () => string
}

function toOrpcError(error: unknown): ORPCError<string, unknown> {
  if (error instanceof ORPCError) {
    return error
  }

  const message = error instanceof Error ? error.message : 'Invalid request'

  if (/not found/i.test(message)) {
    return new ORPCError('NOT_FOUND', { message })
  }

  if (/forbidden|another clinician|cannot be modified|retired/i.test(message)) {
    return new ORPCError('FORBIDDEN', { message })
  }

  return new ORPCError('BAD_REQUEST', { message })
}

export async function replaceSessionExerciseRows(
  sessionExercise: SessionExerciseDelegate,
  patientSessionId: string,
  exercises: SessionExerciseSnapshotRow[],
) {
  validateUniqueExercisePositions(exercises)

  const previousRows = await sessionExercise.findMany({
    where: { patientSessionId },
    orderBy: { position: 'asc' },
  })

  const rowsWithSessionId = exercises.map((exercise) => ({
    ...exercise,
    patientSessionId,
  }))

  const { toDelete, toCreate, toUpdate } = diffById(previousRows, exercises)

  if (toDelete.length > 0) {
    await sessionExercise.deleteMany({
      where: { id: { in: toDelete.map((row) => row.id) } },
    })
  }

  if (toCreate.length > 0) {
    await sessionExercise.createMany({
      data: toCreate.map((exercise) => ({
        ...exercise,
        patientSessionId,
      })),
    })
  }

  for (const exercise of toUpdate) {
    await sessionExercise.update({
      where: { id: exercise.id },
      data: {
        patientSessionId,
        exerciseId: exercise.exerciseId,
        position: exercise.position,
        sets: exercise.sets,
        reps: exercise.reps,
        restTime: exercise.restTime,
        holdTime: exercise.holdTime,
        speed: exercise.speed,
      },
    })
  }

  return rowsWithSessionId
}

export async function replaceReusableProgramExercises(
  reusableProgramExercise: ReusableProgramExerciseDelegate,
  reusableProgramId: string,
  sessionExercises: SessionExerciseSnapshotRow[],
  createExerciseId: () => string,
) {
  const nextExercises = mapSessionExercisesToReusableProgramExercises(
    sessionExercises,
    reusableProgramId,
    createExerciseId,
  )

  validateUniqueExercisePositions(nextExercises)

  const previousExercises = await reusableProgramExercise.findMany({
    where: { reusableProgramId },
  })

  const { toDelete, toCreate, toUpdate } = diffById(
    previousExercises,
    nextExercises,
  )

  if (toDelete.length > 0) {
    await reusableProgramExercise.deleteMany({
      where: { id: { in: toDelete.map((exercise) => exercise.id) } },
    })
  }

  if (toCreate.length > 0) {
    await reusableProgramExercise.createMany({ data: toCreate })
  }

  for (const exercise of toUpdate) {
    await reusableProgramExercise.update({
      where: { id: exercise.id },
      data: exercise,
    })
  }
}

export async function completePatientSessionWithSaveChoice(
  deps: CompletePatientSessionDeps,
  clinicianUserId: string,
  input: CompletePatientSessionInput,
) {
  const now = deps.now ?? new Date()
  const createId = deps.createId ?? generateUUID

  try {
    const session = await deps.patientSession.findFirst({
      where: { id: input.id, deletedAt: null },
      include: {
        sessionExercise: { orderBy: { position: 'asc' } },
      },
    })

    if (!session) {
      throw new Error('Patient session not found')
    }

    assertSessionCanBeCompleted(session.status)

    const sourceProgram = session.sourceReusableProgramId
      ? await deps.reusableProgram.findFirst({
          where: { id: session.sourceReusableProgramId },
        })
      : null

    const snapshotExercises =
      input.exercises ??
      session.sessionExercise.map((exercise) => ({
        id: exercise.id,
        exerciseId: exercise.exerciseId,
        position: exercise.position,
        sets: exercise.sets,
        reps: exercise.reps,
        restTime: exercise.restTime,
        holdTime: exercise.holdTime,
        speed: exercise.speed,
      }))

    const resolvedProgramName =
      input.saveChoice === SessionCompletionSaveChoice.SAVE_AS_NEW_PROGRAM
        ? input.newProgramName?.trim() ||
          buildSaveAsNewProgramName(session.sourceProgramName)
        : undefined

    assertCompletionSaveChoiceAllowed(
      input.saveChoice,
      session,
      sourceProgram,
      clinicianUserId,
      snapshotExercises.length,
      resolvedProgramName,
    )

    if (input.exercises) {
      await replaceSessionExerciseRows(
        deps.sessionExercise,
        session.id,
        input.exercises,
      )
    }

    const completedSession = await deps.patientSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    })

    if (
      input.saveChoice === SessionCompletionSaveChoice.UPDATE_SOURCE_PROGRAM &&
      session.sourceReusableProgramId
    ) {
      await replaceReusableProgramExercises(
        deps.reusableProgramExercise,
        session.sourceReusableProgramId,
        snapshotExercises,
        createId,
      )

      await deps.reusableProgram.update({
        where: { id: session.sourceReusableProgramId },
        data: { updatedAt: now },
      })
    }

    if (input.saveChoice === SessionCompletionSaveChoice.SAVE_AS_NEW_PROGRAM) {
      const newProgramId = createId()
      const programExercises = mapSessionExercisesToReusableProgramExercises(
        snapshotExercises,
        newProgramId,
        createId,
      )

      await deps.reusableProgram.create({
        data: {
          id: newProgramId,
          name: resolvedProgramName!,
          kind: 'CLINICIAN_OWNED',
          userId: clinicianUserId,
          createdAt: now,
          updatedAt: now,
          retiredAt: null,
        },
      })

      if (programExercises.length > 0) {
        await deps.reusableProgramExercise.createMany({
          data: programExercises,
        })
      }
    }

    return completedSession
  } catch (error) {
    throw toOrpcError(error)
  }
}
