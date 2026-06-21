export async function createPatientSessionFromAck<
  TPatientSession extends { id: string },
  TSessionData,
  TExerciseRow,
>(
  clients: {
    patientSession: {
      create: (args: { data: TSessionData }) => Promise<TPatientSession>
    }
    sessionExercise: {
      createMany: (args: {
        data: Array<TExerciseRow & { patientSessionId: string }>
      }) => Promise<unknown>
    }
  },
  input: {
    session: TSessionData
    exercises: TExerciseRow[]
  },
): Promise<TPatientSession> {
  const patientSession = await clients.patientSession.create({
    data: input.session,
  })

  await clients.sessionExercise.createMany({
    data: input.exercises.map((exercise) => ({
      ...exercise,
      patientSessionId: patientSession.id,
    })) as Array<TExerciseRow & { patientSessionId: string }>,
  })

  return patientSession
}
