import { ORPCError } from '@orpc/server'
import {
  checkExerciseDraftOccupancyInputSchema,
  exerciseDraftIdInputSchema,
  promoteExerciseDraftInputSchema,
  saveExerciseDraftInputSchema,
} from '@virtality/shared/types'
import {
  ExerciseDraftExerciseIdError,
  ExerciseDraftExerciseIdOccupiedError,
  ExerciseDraftNameOccupiedError,
  ExerciseDraftNotFoundError,
  ExerciseDraftPromoteError,
  ExerciseDraftUnityStemError,
  generateUUID,
} from '@virtality/shared/utils'
import { adminAuthed } from '../middleware/admin.ts'
import {
  checkExerciseDraftOccupancy,
  createExerciseDraft,
  discardExerciseDraftById,
  getExerciseDraft,
  listExerciseDraftClassificationVocabulary,
  listExerciseDrafts,
  promoteExerciseDraftToCatalog,
  saveExerciseDraftFields,
} from './exercise-draft-service.ts'

function throwExerciseDraftOrpcError(error: unknown): never {
  if (error instanceof ExerciseDraftNotFoundError) {
    throw new ORPCError('NOT_FOUND', { message: error.message })
  }

  if (
    error instanceof ExerciseDraftUnityStemError ||
    error instanceof ExerciseDraftExerciseIdError ||
    error instanceof ExerciseDraftExerciseIdOccupiedError ||
    error instanceof ExerciseDraftPromoteError ||
    error instanceof ExerciseDraftNameOccupiedError
  ) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }

  throw error
}

async function withExerciseDraftErrors<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throwExerciseDraftOrpcError(error)
  }
}

const create = adminAuthed
  .route({ path: '/exercise-draft/create', method: 'POST' })
  .handler(async ({ context }) => {
    const userId = context.user?.id
    if (!userId) {
      throw new ORPCError('UNAUTHORIZED')
    }

    return withExerciseDraftErrors(() =>
      createExerciseDraft(context.prisma, {
        id: generateUUID(),
        createdBy: userId,
      }),
    )
  })

const get = adminAuthed
  .route({ path: '/exercise-draft/get', method: 'GET' })
  .input(exerciseDraftIdInputSchema)
  .handler(async ({ context, input }) => {
    const draft = await getExerciseDraft(context.prisma, input.id)
    if (!draft) {
      throw new ORPCError('NOT_FOUND', {
        message: `Exercise draft ${input.id} was not found.`,
      })
    }

    return draft
  })

const list = adminAuthed
  .route({ path: '/exercise-draft/list', method: 'GET' })
  .handler(async ({ context }) => listExerciseDrafts(context.prisma))

const save = adminAuthed
  .route({ path: '/exercise-draft/save', method: 'POST' })
  .input(saveExerciseDraftInputSchema)
  .handler(async ({ context, input }) => {
    const { id, ...data } = input
    return withExerciseDraftErrors(() =>
      saveExerciseDraftFields(context.prisma, id, data),
    )
  })

const discard = adminAuthed
  .route({ path: '/exercise-draft/discard', method: 'POST' })
  .input(exerciseDraftIdInputSchema)
  .handler(async ({ context, input }) =>
    withExerciseDraftErrors(() =>
      discardExerciseDraftById(context.prisma, input.id),
    ),
  )

const checkOccupancy = adminAuthed
  .route({ path: '/exercise-draft/check-occupancy', method: 'POST' })
  .input(checkExerciseDraftOccupancyInputSchema)
  .handler(async ({ context, input }) =>
    withExerciseDraftErrors(() =>
      checkExerciseDraftOccupancy(context.prisma, input),
    ),
  )

const listClassificationVocabulary = adminAuthed
  .route({
    path: '/exercise-draft/classification-vocabulary',
    method: 'GET',
  })
  .handler(async ({ context }) =>
    listExerciseDraftClassificationVocabulary(context.prisma),
  )

const promote = adminAuthed
  .route({ path: '/exercise-draft/promote', method: 'POST' })
  .input(promoteExerciseDraftInputSchema)
  .handler(async ({ context, input }) =>
    withExerciseDraftErrors(() =>
      promoteExerciseDraftToCatalog(context.prisma, {
        draftId: input.draftId,
      }),
    ),
  )

export const exerciseDraft = {
  create,
  get,
  list,
  save,
  discard,
  checkOccupancy,
  listClassificationVocabulary,
  promote,
}
