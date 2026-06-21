import {
  assertSessionExerciseRowsMutable,
  type SessionExerciseSnapshotRow,
} from '@virtality/shared/utils'
import { ORPCError } from '@orpc/server'
import { replaceSessionExerciseRows } from './session-completion.ts'

type PatientSessionDelegate = {
  findFirst: (args: {
    where: { id: string; deletedAt: null }
  }) => Promise<{ id: string; status: string } | null>
}

type SessionExerciseDelegate = {
  findMany: (args: {
    where: { patientSessionId: string }
    orderBy: { position: 'asc' }
  }) => Promise<SessionExerciseSnapshotRow[]>
  deleteMany: (args: { where: { id: { in: string[] } } }) => Promise<unknown>
  createMany: (args: {
    data: Array<SessionExerciseSnapshotRow & { patientSessionId: string }>
  }) => Promise<unknown>
  update: (args: {
    where: { id: string }
    data: Omit<SessionExerciseSnapshotRow, 'id'> & {
      patientSessionId: string
    }
  }) => Promise<unknown>
}

export type SyncSessionWorkingCopyInput = {
  id: string
  exercises: SessionExerciseSnapshotRow[]
}

export type SyncSessionWorkingCopyDeps = {
  patientSession: PatientSessionDelegate
  sessionExercise: SessionExerciseDelegate
}

export async function syncSessionWorkingCopy(
  deps: SyncSessionWorkingCopyDeps,
  input: SyncSessionWorkingCopyInput,
) {
  const session = await deps.patientSession.findFirst({
    where: { id: input.id, deletedAt: null },
  })

  if (!session) {
    throw new ORPCError('NOT_FOUND', { message: 'Patient session not found' })
  }

  try {
    assertSessionExerciseRowsMutable(session.status)
  } catch (error) {
    throw new ORPCError('BAD_REQUEST', {
      message:
        error instanceof Error
          ? error.message
          : 'Session exercise rows cannot be modified',
    })
  }

  await replaceSessionExerciseRows(
    deps.sessionExercise,
    session.id,
    input.exercises,
  )

  return {
    id: session.id,
    exercises: input.exercises,
  }
}
