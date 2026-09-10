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
    findExerciseDraftReferences: (lookupValues) =>
      prisma.exerciseDraft.findMany({
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
    findPartnerLogoReferences: (lookupValues) =>
      prisma.marketingPartnerLogo
        .findMany({
          where: { objectKey: { in: lookupValues } },
          select: {
            id: true,
            alt: true,
            objectKey: true,
          },
        })
        .then((partnerLogos) =>
          partnerLogos.map(({ id, alt, objectKey }) => ({
            id,
            alt,
            image: objectKey,
          })),
        ),
    findPromoVideoReferences: (lookupValues) =>
      prisma.marketingPromoVideo
        .findMany({
          where: { objectKey: { in: lookupValues } },
          select: {
            id: true,
            objectKey: true,
          },
        })
        .then((promoVideos) =>
          promoVideos.map(({ id, objectKey }) => ({
            id,
            label: 'Landing promo video',
            video: objectKey,
          })),
        ),
    findMosaicTileReferences: (lookupValues) =>
      prisma.marketingMosaicTile
        .findMany({
          where: { objectKey: { in: lookupValues } },
          select: {
            id: true,
            alt: true,
            objectKey: true,
            mediaKind: true,
          },
        })
        .then((mosaicTiles) =>
          mosaicTiles.map(({ id, alt, objectKey, mediaKind }) => ({
            id,
            alt,
            image: objectKey,
            mediaKind,
          })),
        ),
  }
}
