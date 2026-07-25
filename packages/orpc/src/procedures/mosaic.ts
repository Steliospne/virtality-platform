import { ORPCError } from '@orpc/server'
import type { MarketingMosaicTile, PrismaClient } from '@virtality/db'
import { saveMosaicInputSchema } from '@virtality/shared/types'
import { generateUUID } from '@virtality/shared/utils'
import {
  getMosaicBoard,
  MosaicValidationError,
  saveMosaicBoard,
  type MosaicStore,
  type MosaicTileRecord,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'
import { base, bustWebsiteMarketingCache } from '../context.ts'

const LANDING_MOSAIC_ID = 'landing'

function toMosaicTileRecord(tile: MarketingMosaicTile): MosaicTileRecord {
  return {
    id: tile.id,
    objectKey: tile.objectKey,
    mediaKind: tile.mediaKind,
    alt: tile.alt,
    row: tile.row,
    col: tile.col,
    width: tile.width as MosaicTileRecord['width'],
    height: tile.height as MosaicTileRecord['height'],
  }
}

function toPrismaTileData(tile: MosaicTileRecord) {
  return {
    id: tile.id,
    mosaicId: LANDING_MOSAIC_ID,
    objectKey: tile.objectKey,
    mediaKind: tile.mediaKind,
    alt: tile.alt,
    row: tile.row,
    col: tile.col,
    width: tile.width,
    height: tile.height,
  }
}

async function listMosaicTiles(
  prisma: PrismaClient,
): Promise<MosaicTileRecord[]> {
  const mosaic = await prisma.marketingLandingMosaic.findUnique({
    where: { id: LANDING_MOSAIC_ID },
    include: { tiles: true },
  })

  return (mosaic?.tiles ?? []).map(toMosaicTileRecord)
}

function createPrismaMosaicStore(prisma: PrismaClient): MosaicStore {
  return {
    listTiles: () => listMosaicTiles(prisma),
    replaceAllTiles: async (tiles) => {
      await prisma.$transaction(async (tx) => {
        await tx.marketingMosaicTile.deleteMany({
          where: { mosaicId: LANDING_MOSAIC_ID },
        })

        await tx.marketingLandingMosaic.upsert({
          where: { id: LANDING_MOSAIC_ID },
          create: { id: LANDING_MOSAIC_ID },
          update: {},
        })

        if (tiles.length > 0) {
          await tx.marketingMosaicTile.createMany({
            data: tiles.map(toPrismaTileData),
          })
        }
      })

      return listMosaicTiles(prisma)
    },
  }
}

function throwMosaicOrpcError(error: unknown): never {
  if (error instanceof MosaicValidationError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }

  throw error
}

const getMosaicProcedure = base
  .route({ path: '/mosaic/get', method: 'GET' })
  .handler(({ context }) =>
    getMosaicBoard(createPrismaMosaicStore(context.prisma)),
  )

const saveMosaicProcedure = authed
  .route({ path: '/mosaic/save', method: 'POST' })
  .input(saveMosaicInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const result = await saveMosaicBoard(
        createPrismaMosaicStore(context.prisma),
        { generateId: generateUUID },
        input,
      )
      await bustWebsiteMarketingCache(context, { tag: 'mosaic' })
      return result
    } catch (error) {
      throwMosaicOrpcError(error)
    }
  })

export const mosaic = {
  get: getMosaicProcedure,
  save: saveMosaicProcedure,
}
