import type { ExerciseDraft, PrismaClient } from '@virtality/db'
import type { ExerciseDraftWithTimestamps } from '@virtality/shared/types'
import {
  checkExerciseDraftUnityNameOccupancy,
  collectExerciseWizardClassificationVocabulary,
  createEmptyExerciseDraft,
  discardExerciseDraft,
  promoteExerciseDraft,
  saveExerciseDraft,
  type ExerciseDraftRecord,
  type ExerciseDraftStore,
  type ExercisePromoteStore,
} from '@virtality/shared/utils'

function mapPrismaExerciseDraft(row: ExerciseDraft): ExerciseDraftRecord {
  return {
    id: row.id,
    createdBy: row.createdBy,
    laterality: row.laterality,
    exerciseId: row.exerciseId,
    displayName: row.displayName,
    unityStem: row.unityStem,
    unityStemDirty: row.unityStemDirty,
    description: row.description,
    category: row.category,
    item: row.item,
    image: row.image,
    video: row.video,
  }
}

function toExerciseDraftWithTimestamps(
  row: ExerciseDraft,
): ExerciseDraftWithTimestamps {
  return {
    ...mapPrismaExerciseDraft(row),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

async function loadExerciseDraftWithTimestamps(
  prisma: PrismaClient,
  id: string,
): Promise<ExerciseDraftWithTimestamps> {
  const row = await prisma.exerciseDraft.findUniqueOrThrow({ where: { id } })
  return toExerciseDraftWithTimestamps(row)
}

function createExerciseDraftStores(prisma: PrismaClient) {
  return {
    draftStore: createPrismaExerciseDraftStore(prisma),
    promoteStore: createPrismaExercisePromoteStore(prisma),
  }
}

export function createPrismaExerciseDraftStore(
  prisma: PrismaClient,
): ExerciseDraftStore {
  return {
    findById: async (id) => {
      const row = await prisma.exerciseDraft.findUnique({ where: { id } })
      return row ? mapPrismaExerciseDraft(row) : null
    },
    listAll: async () => {
      const rows = await prisma.exerciseDraft.findMany({
        orderBy: { updatedAt: 'desc' },
      })
      return rows.map(mapPrismaExerciseDraft)
    },
    create: async (record) => {
      const row = await prisma.exerciseDraft.create({
        data: record,
      })
      return mapPrismaExerciseDraft(row)
    },
    update: async (id, data) => {
      const row = await prisma.exerciseDraft.update({
        where: { id },
        data,
      })
      return mapPrismaExerciseDraft(row)
    },
    deleteById: async (id) => {
      await prisma.exerciseDraft.delete({ where: { id } })
    },
  }
}

export function createPrismaExercisePromoteStore(
  prisma: PrismaClient,
): ExercisePromoteStore {
  return {
    listExerciseNames: async () => {
      const rows = await prisma.exercise.findMany({ select: { name: true } })
      return rows.map((row) => row.name)
    },
    listExerciseIds: async () => {
      const rows = await prisma.exercise.findMany({ select: { id: true } })
      return rows.map((row) => row.id)
    },
    promoteDraft: async ({ draftId, rows }) =>
      prisma.$transaction(async (tx) => {
        for (const row of rows) {
          await tx.exercise.create({
            data: {
              id: row.id,
              name: row.name,
              displayName: row.displayName,
              category: row.category,
              direction: row.direction,
              item: row.item,
              image: row.image,
              video: row.video,
              description: row.description,
              enabled: row.enabled,
            },
          })
        }

        await tx.exerciseDraft.delete({ where: { id: draftId } })
        return rows
      }),
  }
}

export async function createExerciseDraft(
  prisma: PrismaClient,
  input: { id: string; createdBy: string },
): Promise<ExerciseDraftWithTimestamps> {
  const store = createPrismaExerciseDraftStore(prisma)
  const record = await createEmptyExerciseDraft(store, input)
  return loadExerciseDraftWithTimestamps(prisma, record.id)
}

export async function getExerciseDraft(
  prisma: PrismaClient,
  id: string,
): Promise<ExerciseDraftWithTimestamps | null> {
  const row = await prisma.exerciseDraft.findUnique({ where: { id } })
  if (!row) {
    return null
  }

  return toExerciseDraftWithTimestamps(row)
}

export async function listExerciseDrafts(
  prisma: PrismaClient,
): Promise<ExerciseDraftWithTimestamps[]> {
  const rows = await prisma.exerciseDraft.findMany({
    orderBy: { updatedAt: 'desc' },
  })

  return rows.map(toExerciseDraftWithTimestamps)
}

export async function saveExerciseDraftFields(
  prisma: PrismaClient,
  draftId: string,
  data: Partial<Omit<ExerciseDraftRecord, 'id' | 'createdBy'>>,
): Promise<ExerciseDraftWithTimestamps> {
  const store = createPrismaExerciseDraftStore(prisma)
  const record = await saveExerciseDraft(store, draftId, data)
  return loadExerciseDraftWithTimestamps(prisma, record.id)
}

export async function discardExerciseDraftById(
  prisma: PrismaClient,
  draftId: string,
): Promise<void> {
  const store = createPrismaExerciseDraftStore(prisma)
  await discardExerciseDraft(store, draftId)
}

export async function checkExerciseDraftOccupancy(
  prisma: PrismaClient,
  input: {
    draftId: string
    candidateNames?: string[]
    candidateExerciseIds?: string[]
  },
) {
  const { draftStore, promoteStore } = createExerciseDraftStores(prisma)
  return checkExerciseDraftUnityNameOccupancy(draftStore, promoteStore, input)
}

export async function listExerciseDraftClassificationVocabulary(
  prisma: PrismaClient,
) {
  const [exercises, drafts] = await Promise.all([
    prisma.exercise.findMany({ select: { category: true, item: true } }),
    prisma.exerciseDraft.findMany({ select: { category: true, item: true } }),
  ])

  return collectExerciseWizardClassificationVocabulary(exercises, drafts)
}

export async function promoteExerciseDraftToCatalog(
  prisma: PrismaClient,
  input: { draftId: string },
) {
  const { draftStore, promoteStore } = createExerciseDraftStores(prisma)
  return promoteExerciseDraft(draftStore, promoteStore, input)
}
