import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import {
  createTrialRedeemCode,
  deleteTrialRedeemCode,
  listTrialRedeemCodes,
  TrialRedeemCodeNotFoundError,
  TrialRedeemCodeValidationError,
  type TrialRedeemCodeStore,
  type TrialRedeemDisplayStatus,
} from '@virtality/shared/utils'
import { z } from 'zod/v4'
import { authed } from '../middleware/auth.ts'

const trialRedeemDisplayStatusSchema = z.enum([
  'unused',
  'expired',
  'redeemed',
  'already_entitled',
])

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

const list = authed
  .route({ path: '/trial-redeem-code/list', method: 'GET' })
  .input(listInputSchema)
  .handler(async ({ context, input }) => {
    try {
      return await listTrialRedeemCodes(
        createPrismaTrialRedeemCodeStore(context.prisma),
        {
          displayStatuses: input?.displayStatuses as
            | TrialRedeemDisplayStatus[]
            | undefined,
        },
      )
    } catch (error) {
      throwTrialRedeemOrpcError(error)
    }
  })

const create = authed
  .route({ path: '/trial-redeem-code/create', method: 'POST' })
  .input(createInputSchema)
  .handler(async ({ context, input }) => {
    try {
      return await createTrialRedeemCode(
        createPrismaTrialRedeemCodeStore(context.prisma),
        {
          trialDays: input.trialDays,
          note: input.note,
        },
      )
    } catch (error) {
      throwTrialRedeemOrpcError(error)
    }
  })

const deleteProcedure = authed
  .route({ path: '/trial-redeem-code/delete', method: 'DELETE' })
  .input(deleteInputSchema)
  .handler(async ({ context, input }) => {
    try {
      await deleteTrialRedeemCode(
        createPrismaTrialRedeemCodeStore(context.prisma),
        input.id,
      )
    } catch (error) {
      throwTrialRedeemOrpcError(error)
    }
  })

export const trialRedeemCode = {
  list,
  create,
  delete: deleteProcedure,
}
