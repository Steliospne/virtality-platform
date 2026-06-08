import type { PrismaClient } from '@virtality/db'
import type { BucketReferenceReader } from '@virtality/shared/utils'

export function createPrismaBucketReferenceReader(
  prisma: PrismaClient,
): BucketReferenceReader {
  return {
    findExerciseReferences: (lookupValues) =>
      prisma.exercise.findMany({
        where: {
          OR: [
            { image: { in: lookupValues } },
            { video: { in: lookupValues } },
          ],
        },
        select: {
          id: true,
          displayName: true,
          image: true,
          video: true,
        },
      }),
    findAvatarReferences: (lookupValues) =>
      prisma.avatar.findMany({
        where: { image: { in: lookupValues } },
        select: {
          id: true,
          name: true,
          image: true,
        },
      }),
    findMapReferences: (lookupValues) =>
      prisma.map.findMany({
        where: { image: { in: lookupValues } },
        select: {
          id: true,
          name: true,
          image: true,
        },
      }),
    findPatientReferences: (lookupValues) =>
      prisma.patient.findMany({
        where: { image: { in: lookupValues } },
        select: {
          id: true,
          name: true,
          image: true,
        },
      }),
    findUserReferences: (lookupValues) =>
      prisma.user.findMany({
        where: { image: { in: lookupValues } },
        select: {
          id: true,
          name: true,
          image: true,
        },
      }),
  }
}
