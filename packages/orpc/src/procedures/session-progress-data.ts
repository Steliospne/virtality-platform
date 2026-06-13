export type SessionProgressUpsertInput = {
  patientSessionId: string
  sessionExerciseId: string
  value: string
}

export async function upsertSessionProgressRecords(
  prisma: {
    sessionData: {
      findFirst: (args: {
        where: {
          patientSessionId: string
          sessionExerciseId: string
        }
        select: { id: true }
      }) => Promise<{ id: string } | null>
      update: (args: {
        where: { id: string }
        data: { value: string }
      }) => Promise<unknown>
      create: (args: {
        data: {
          id: string
          patientSessionId: string
          sessionExerciseId: string
          value: string
        }
      }) => Promise<unknown>
    }
  },
  records: SessionProgressUpsertInput[],
  createId: () => string,
) {
  for (const record of records) {
    const existing = await prisma.sessionData.findFirst({
      where: {
        patientSessionId: record.patientSessionId,
        sessionExerciseId: record.sessionExerciseId,
      },
      select: { id: true },
    })

    if (existing) {
      await prisma.sessionData.update({
        where: { id: existing.id },
        data: { value: record.value },
      })
      continue
    }

    await prisma.sessionData.create({
      data: {
        id: createId(),
        patientSessionId: record.patientSessionId,
        sessionExerciseId: record.sessionExerciseId,
        value: record.value,
      },
    })
  }
}
