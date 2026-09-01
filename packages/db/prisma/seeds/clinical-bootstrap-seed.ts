import type { PrismaClient } from '../generated/client.js'
import { CLINICAL_SEED } from './clinical-bootstrap-constants.ts'

export async function seedClinicalBootstrap(
  prisma: PrismaClient,
  ownerUserId: string,
): Promise<void> {
  const now = new Date()

  for (const exercise of CLINICAL_SEED.exercises) {
    await prisma.exercise.upsert({
      where: { id: exercise.id },
      create: {
        ...exercise,
        enabled: true,
        isNew: false,
      },
      update: {
        name: exercise.name,
        displayName: exercise.displayName,
        category: exercise.category,
        direction: exercise.direction,
        description: exercise.description,
        enabled: true,
      },
    })
  }

  for (const patient of CLINICAL_SEED.patients) {
    await prisma.patient.upsert({
      where: { id: patient.id },
      create: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        userId: ownerUserId,
        language: 'English',
        createdAt: now,
        updatedAt: now,
      },
      update: {
        name: patient.name,
        email: patient.email,
        userId: ownerUserId,
        updatedAt: now,
        deletedAt: null,
      },
    })
  }

  for (const program of CLINICAL_SEED.reusablePrograms) {
    await prisma.reusableProgram.upsert({
      where: { id: program.id },
      create: {
        id: program.id,
        name: program.name,
        kind: 'CLINICIAN_OWNED',
        userId: ownerUserId,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        name: program.name,
        userId: ownerUserId,
        updatedAt: now,
        retiredAt: null,
      },
    })
  }

  for (const link of CLINICAL_SEED.reusableProgramExercises) {
    await prisma.reusableProgramExercise.upsert({
      where: { id: link.id },
      create: {
        id: link.id,
        reusableProgramId: link.reusableProgramId,
        exerciseId: link.exerciseId,
        position: link.position,
        sets: 3,
        reps: 10,
        restTime: 5,
        holdTime: 1,
        speed: 1,
      },
      update: {
        reusableProgramId: link.reusableProgramId,
        exerciseId: link.exerciseId,
        position: link.position,
      },
    })
  }

  for (const program of CLINICAL_SEED.patientPrograms) {
    await prisma.patientProgram.upsert({
      where: { id: program.id },
      create: {
        id: program.id,
        name: program.name,
        userId: ownerUserId,
        patientId: program.patientId,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        name: program.name,
        userId: ownerUserId,
        patientId: program.patientId,
        updatedAt: now,
        deletedAt: null,
      },
    })
  }

  for (const link of CLINICAL_SEED.programExercises) {
    await prisma.programExercise.upsert({
      where: { id: link.id },
      create: {
        id: link.id,
        programId: link.programId,
        exerciseId: link.exerciseId,
        sets: 3,
        reps: 10,
        restTime: 5,
        holdTime: 1,
        speed: 1,
      },
      update: {
        programId: link.programId,
        exerciseId: link.exerciseId,
      },
    })
  }

  await prisma.patientSession.upsert({
    where: { id: CLINICAL_SEED.session.id },
    create: {
      id: CLINICAL_SEED.session.id,
      patientId: CLINICAL_SEED.session.patientId,
      programId: CLINICAL_SEED.session.programId,
      status: 'COMPLETED',
      notes: 'Local seed session',
      createdAt: now,
      completedAt: now,
    },
    update: {
      patientId: CLINICAL_SEED.session.patientId,
      programId: CLINICAL_SEED.session.programId,
      status: 'COMPLETED',
      notes: 'Local seed session',
      completedAt: now,
      deletedAt: null,
    },
  })

  await prisma.sessionExercise.upsert({
    where: { id: CLINICAL_SEED.sessionExercise.id },
    create: {
      id: CLINICAL_SEED.sessionExercise.id,
      patientSessionId: CLINICAL_SEED.session.id,
      exerciseId: CLINICAL_SEED.sessionExercise.exerciseId,
      position: 0,
      sets: 3,
      reps: 10,
      restTime: 5,
      holdTime: 1,
      speed: 1,
    },
    update: {
      patientSessionId: CLINICAL_SEED.session.id,
      exerciseId: CLINICAL_SEED.sessionExercise.exerciseId,
      position: 0,
    },
  })

  await prisma.sessionData.upsert({
    where: { id: CLINICAL_SEED.sessionData.id },
    create: {
      id: CLINICAL_SEED.sessionData.id,
      patientSessionId: CLINICAL_SEED.session.id,
      sessionExerciseId: CLINICAL_SEED.sessionExercise.id,
      value: CLINICAL_SEED.sessionData.value,
    },
    update: {
      patientSessionId: CLINICAL_SEED.session.id,
      sessionExerciseId: CLINICAL_SEED.sessionExercise.id,
      value: CLINICAL_SEED.sessionData.value,
    },
  })

  await prisma.device.upsert({
    where: { id: CLINICAL_SEED.device.id },
    create: {
      id: CLINICAL_SEED.device.id,
      userId: ownerUserId,
      deviceId: CLINICAL_SEED.device.deviceId,
      name: CLINICAL_SEED.device.name,
      model: CLINICAL_SEED.device.model,
      createdAt: now,
      lastUsed: now,
    },
    update: {
      userId: ownerUserId,
      deviceId: CLINICAL_SEED.device.deviceId,
      name: CLINICAL_SEED.device.name,
      model: CLINICAL_SEED.device.model,
      lastUsed: now,
      deletedAt: null,
    },
  })
}
