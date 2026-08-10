import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import {
  createTrialRedeemCode,
  deleteTrialRedeemCode,
  listTrialRedeemCodes,
  TrialRedeemCodeNotFoundError,
  TrialRedeemCodeValidationError,
  TRIAL_REDEEM_DISPLAY_STATUSES,
  type TrialRedeemCodeStore,
} from '@virtality/shared/utils'
import { z } from 'zod/v4'
import { authed } from '../middleware/auth.ts'

const trialRedeemDisplayStatusSchema = z.enum(TRIAL_REDEEM_DISPLAY_STATUSES)

const createInputSchema = z.object({
  trialDays: z.number().int().positive().optional(),
  note: z.string().trim().max(500).nullable().optional(),
})

const listInputSchema = z
  .object({
    displayStatuses: z.array(trialRedeemDisplayStatusSchema).optional(),
  })
  .optional()

const deleteInputSchema = z.object({
  id: z.number().int().positive(),
})

export function createPrismaTrialRedeemCodeStore(
  prisma: PrismaClient,
): TrialRedeemCodeStore {
  return {
    findByCode: (code) =>
      prisma.trialRedeemCode.findUnique({
        where: { code },
      }),
    findById: (id) =>
      prisma.trialRedeemCode.findUnique({
        where: { id },
      }),
    create: (data) => prisma.trialRedeemCode.create({ data }),
    listAll: () =>
      prisma.trialRedeemCode.findMany({
        orderBy: { id: 'desc' },
      }),
    deleteById: async (id) => {
      await prisma.trialRedeemCode.delete({
        where: { id },
      })
    },
  }
}

function throwTrialRedeemOrpcError(error: unknown): never {
  if (error instanceof TrialRedeemCodeValidationError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }
  if (error instanceof TrialRedeemCodeNotFoundError) {
    throw new ORPCError('NOT_FOUND', { message: error.message })
  }
  throw error
}

async function runTrialRedeemHandler<T>(
  prisma: PrismaClient,
  run: (store: TrialRedeemCodeStore) => Promise<T>,
): Promise<T> {
  try {
    return await run(createPrismaTrialRedeemCodeStore(prisma))
  } catch (error) {
    throwTrialRedeemOrpcError(error)
  }
}

const list = authed
  .route({ path: '/trial-redeem-code/list', method: 'GET' })
  .input(listInputSchema)
  .handler(async ({ context, input }) =>
    runTrialRedeemHandler(context.prisma, (store) =>
      listTrialRedeemCodes(store, {
        displayStatuses: input?.displayStatuses,
      }),
    ),
  )

const create = authed
  .route({ path: '/trial-redeem-code/create', method: 'POST' })
  .input(createInputSchema)
  .handler(async ({ context, input }) =>
    runTrialRedeemHandler(context.prisma, (store) =>
      createTrialRedeemCode(store, {
        trialDays: input.trialDays,
        note: input.note,
      }),
    ),
  )

const deleteProcedure = authed
  .route({ path: '/trial-redeem-code/delete', method: 'DELETE' })
  .input(deleteInputSchema)
  .handler(async ({ context, input }) => {
    await runTrialRedeemHandler(context.prisma, (store) =>
      deleteTrialRedeemCode(store, input.id),
    )
  })

export const trialRedeemCode = {
  list,
  create,
  delete: deleteProcedure,
}
