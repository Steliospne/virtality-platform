import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import * as lucideReact from 'lucide-react'
import {
  createHighlightCardInputSchema,
  highlightCardsCacheTag,
  listHighlightCardsInputSchema,
  removeHighlightCardInputSchema,
  reorderHighlightCardInputSchema,
  updateHighlightCardInputSchema,
} from '@virtality/shared/types'
import { generateUUID } from '@virtality/shared/utils'
import {
  createHighlightCard,
  HighlightCardCollectionFullError,
  HighlightCardNotFoundError,
  HighlightCardValidationError,
  listHighlightCards,
  removeHighlightCard,
  reorderHighlightCard,
  updateHighlightCard,
  type HighlightCardStore,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'
import { base, bustWebsiteMarketingCache } from '../context.ts'

function createPrismaHighlightCardStore(
  prisma: PrismaClient,
): HighlightCardStore {
  return {
    findById: (id) =>
      prisma.marketingHighlightCard.findUnique({
        where: { id },
      }),
    create: (data) => prisma.marketingHighlightCard.create({ data }),
    update: (id, data) =>
      prisma.marketingHighlightCard.update({
        where: { id },
        data,
      }),
    deleteById: async (id) => {
      await prisma.marketingHighlightCard.delete({
        where: { id },
      })
    },
    listAll: () => prisma.marketingHighlightCard.findMany(),
    listByCollection: (collection) =>
      prisma.marketingHighlightCard.findMany({
        where: { collection },
      }),
  }
}

function throwHighlightCardOrpcError(error: unknown): never {
  if (error instanceof HighlightCardValidationError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }

  if (error instanceof HighlightCardCollectionFullError) {
    throw new ORPCError('CONFLICT', { message: error.message })
  }

  if (error instanceof HighlightCardNotFoundError) {
    throw new ORPCError('NOT_FOUND', { message: error.message })
  }

  throw error
}

async function withHighlightCardStore<T>(
  prisma: PrismaClient,
  operation: (store: HighlightCardStore) => Promise<T>,
): Promise<T> {
  try {
    return await operation(createPrismaHighlightCardStore(prisma))
  } catch (error) {
    throwHighlightCardOrpcError(error)
  }
}

const listHighlightCardsProcedure = base
  .route({ path: '/highlight-card/list', method: 'GET' })
  .input(listHighlightCardsInputSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    return listHighlightCards(
      createPrismaHighlightCardStore(prisma),
      input.collection,
    )
  })

const createHighlightCardProcedure = authed
  .route({ path: '/highlight-card/create', method: 'POST' })
  .input(createHighlightCardInputSchema)
  .handler(async ({ context, input }) => {
    const result = await withHighlightCardStore(context.prisma, (store) =>
      createHighlightCard(
        store,
        {
          generateId: generateUUID,
          lucideModule: lucideReact,
        },
        input,
      ),
    )
    await bustWebsiteMarketingCache(context, {
      tag: highlightCardsCacheTag(result.collection),
    })
    return result
  })

const updateHighlightCardProcedure = authed
  .route({ path: '/highlight-card/update', method: 'POST' })
  .input(updateHighlightCardInputSchema)
  .handler(async ({ context, input }) => {
    const result = await withHighlightCardStore(context.prisma, (store) =>
      updateHighlightCard(store, { lucideModule: lucideReact }, input),
    )
    await bustWebsiteMarketingCache(context, {
      tag: highlightCardsCacheTag(result.collection),
    })
    return result
  })

const reorderHighlightCardProcedure = authed
  .route({ path: '/highlight-card/reorder', method: 'POST' })
  .input(reorderHighlightCardInputSchema)
  .handler(async ({ context, input }) => {
    const outcome = await withHighlightCardStore(
      context.prisma,
      async (store) => {
        const existing = await store.findById(input.id)
        const result = await reorderHighlightCard(store, input)
        return {
          result,
          collection: existing?.collection,
        }
      },
    )
    if (outcome.collection) {
      await bustWebsiteMarketingCache(context, {
        tag: highlightCardsCacheTag(outcome.collection),
      })
    }
    return outcome.result
  })

const removeHighlightCardProcedure = authed
  .route({ path: '/highlight-card/remove', method: 'DELETE' })
  .input(removeHighlightCardInputSchema)
  .handler(async ({ context, input }) => {
    const outcome = await withHighlightCardStore(
      context.prisma,
      async (store) => {
        const existing = await store.findById(input.id)
        const result = await removeHighlightCard(store, input)
        return {
          result,
          collection: existing?.collection,
        }
      },
    )
    if (outcome.collection) {
      await bustWebsiteMarketingCache(context, {
        tag: highlightCardsCacheTag(outcome.collection),
      })
    }
    return outcome.result
  })

export const highlightCard = {
  list: listHighlightCardsProcedure,
  create: createHighlightCardProcedure,
  update: updateHighlightCardProcedure,
  reorder: reorderHighlightCardProcedure,
  remove: removeHighlightCardProcedure,
}
