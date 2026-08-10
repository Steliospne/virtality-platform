import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import {
  createRenewTriggerInputSchema,
  listRenewTriggersInputSchema,
  removeRenewTriggerInputSchema,
  updateRenewTriggerInputSchema,
} from '@virtality/shared/types'
import { generateUUID } from '@virtality/shared/utils'
import {
  createRenewTrigger,
  listRenewTriggers,
  removeRenewTrigger,
  RenewTriggerDuplicateDaysBeforeError,
  RenewTriggerNotFoundError,
  RenewTriggerValidationError,
  updateRenewTrigger,
  type RenewTriggerStore,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'
import { base } from '../context.ts'

function createPrismaRenewTriggerStore(
  prisma: PrismaClient,
): RenewTriggerStore {
  return {
    findById: (id) =>
      prisma.renewTrigger.findUnique({
        where: { id },
      }),
    findByChannelAndDaysBefore: (channel, daysBefore) =>
      prisma.renewTrigger.findUnique({
        where: {
          channel_daysBefore: { channel, daysBefore },
        },
      }),
    create: (data) => prisma.renewTrigger.create({ data }),
    update: (id, data) =>
      prisma.renewTrigger.update({
        where: { id },
        data,
      }),
    deleteById: async (id) => {
      await prisma.renewTrigger.delete({
        where: { id },
      })
    },
    listByChannel: (channel) =>
      prisma.renewTrigger.findMany({
        where: { channel },
      }),
  }
}

function throwRenewTriggerOrpcError(error: unknown): never {
  if (error instanceof RenewTriggerValidationError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }

  if (error instanceof RenewTriggerDuplicateDaysBeforeError) {
    throw new ORPCError('CONFLICT', { message: error.message })
  }

  if (error instanceof RenewTriggerNotFoundError) {
    throw new ORPCError('NOT_FOUND', { message: error.message })
  }

  throw error
}

async function withRenewTriggerStore<T>(
  prisma: PrismaClient,
  operation: (store: RenewTriggerStore) => Promise<T>,
): Promise<T> {
  try {
    return await operation(createPrismaRenewTriggerStore(prisma))
  } catch (error) {
    throwRenewTriggerOrpcError(error)
  }
}

const listRenewTriggersProcedure = base
  .route({ path: '/renew-trigger/list', method: 'GET' })
  .input(listRenewTriggersInputSchema)
  .handler(async ({ context, input }) => {
    return listRenewTriggers(
      createPrismaRenewTriggerStore(context.prisma),
      input.channel,
    )
  })

const createRenewTriggerProcedure = authed
  .route({ path: '/renew-trigger/create', method: 'POST' })
  .input(createRenewTriggerInputSchema)
  .handler(async ({ context, input }) => {
    return withRenewTriggerStore(context.prisma, (store) =>
      createRenewTrigger(store, { generateId: generateUUID }, input),
    )
  })

const updateRenewTriggerProcedure = authed
  .route({ path: '/renew-trigger/update', method: 'POST' })
  .input(updateRenewTriggerInputSchema)
  .handler(async ({ context, input }) => {
    return withRenewTriggerStore(context.prisma, (store) =>
      updateRenewTrigger(store, input),
    )
  })

const removeRenewTriggerProcedure = authed
  .route({ path: '/renew-trigger/remove', method: 'DELETE' })
  .input(removeRenewTriggerInputSchema)
  .handler(async ({ context, input }) => {
    return withRenewTriggerStore(context.prisma, (store) =>
      removeRenewTrigger(store, input),
    )
  })

export const renewTrigger = {
  list: listRenewTriggersProcedure,
  create: createRenewTriggerProcedure,
  update: updateRenewTriggerProcedure,
  remove: removeRenewTriggerProcedure,
}
