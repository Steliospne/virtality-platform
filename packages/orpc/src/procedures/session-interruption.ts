import { assertSessionCanBeInterrupted } from '@virtality/shared/utils'
import { ORPCError } from '@orpc/server'

type PatientSessionDelegate = {
  findFirst: (args: {
    where: { id: string; deletedAt: null }
    include: {
      sessionExercise: { orderBy: { position: 'asc' } }
      sessionData: true
    }
  }) => Promise<{
    id: string
    status: string
    sessionExercise: unknown[]
    sessionData: unknown[]
  } | null>
  update: (args: {
    where: { id: string }
    data: { status: 'INTERRUPTED' }
  }) => Promise<{
    id: string
    status: string
    completedAt: Date | null
  }>
}

export async function interruptPatientSession(
  patientSession: PatientSessionDelegate,
  sessionId: string,
) {
  const session = await patientSession.findFirst({
    where: { id: sessionId, deletedAt: null },
    include: {
      sessionExercise: { orderBy: { position: 'asc' } },
      sessionData: true,
    },
  })

  if (!session) {
    throw new ORPCError('NOT_FOUND', { message: 'Patient session not found' })
  }

  try {
    assertSessionCanBeInterrupted(session.status)
  } catch (error) {
    throw new ORPCError('BAD_REQUEST', {
      message:
        error instanceof Error ? error.message : 'Invalid session status',
    })
  }

  const updated = await patientSession.update({
    where: { id: sessionId },
    data: { status: 'INTERRUPTED' },
  })

  return {
    session: updated,
    retainedExerciseCount: session.sessionExercise.length,
    retainedProgressCount: session.sessionData.length,
  }
}
