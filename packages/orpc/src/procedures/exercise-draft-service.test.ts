import { describe, expect, it, vi } from 'vitest'
import {
  createExerciseDraft,
  listExerciseDraftClassificationVocabulary,
  promoteExerciseDraftToCatalog,
} from './exercise-draft-service.ts'

describe('exercise draft service', () => {
  it('creates an empty draft attributed to the admin', async () => {
    const createdRow = {
      id: 'draft-1',
      createdBy: 'admin-1',
      laterality: null,
      exerciseId: '',
      displayName: '',
      unityStem: '',
      unityStemDirty: false,
      description: '',
      category: '',
      item: null,
      image: null,
      video: null,
      createdAt: new Date('2026-09-10T12:00:00.000Z'),
      updatedAt: new Date('2026-09-10T12:00:00.000Z'),
    }

    const prisma = {
      exerciseDraft: {
        create: vi.fn(async () => createdRow),
        findUniqueOrThrow: vi.fn(async () => createdRow),
      },
    }

    const draft = await createExerciseDraft(prisma as never, {
      id: 'draft-1',
      createdBy: 'admin-1',
    })

    expect(draft).toMatchObject({
      id: 'draft-1',
      createdBy: 'admin-1',
      laterality: null,
      displayName: '',
      createdAt: createdRow.createdAt,
      updatedAt: createdRow.updatedAt,
    })
  })

  it('promotes a complete draft in one transaction', async () => {
    const completeDraft = {
      id: 'draft-1',
      createdBy: 'admin-1',
      laterality: 'single' as const,
      exerciseId: '420',
      displayName: 'Bicep Curls',
      unityStem: '',
      unityStemDirty: false,
      description: 'Curl.',
      category: 'Arms',
      item: null,
      image: 'https://cdn.virtality.app/a.jpg',
      video: 'https://cdn.virtality.app/a.mp4',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const prisma = {
      exercise: {
        findMany: vi.fn(async () => []),
      },
      exerciseDraft: {
        findUnique: vi.fn(async () => completeDraft),
        findMany: vi.fn(async () => [completeDraft]),
        delete: vi.fn(async () => undefined),
      },
      $transaction: vi.fn(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            exercise: {
              create: vi.fn(async () => undefined),
            },
            exerciseDraft: {
              delete: vi.fn(async () => undefined),
            },
          }
          return callback(tx)
        },
      ),
    }

    const rows = await promoteExerciseDraftToCatalog(prisma as never, {
      draftId: 'draft-1',
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: '420',
      name: 'BicepCurls',
      enabled: true,
    })
  })

  it('lists classification vocabulary from exercises and drafts', async () => {
    const prisma = {
      exercise: {
        findMany: vi.fn(async () => [
          { category: 'Legs', item: 'Band' },
          { category: 'Core', item: null },
        ]),
      },
      exerciseDraft: {
        findMany: vi.fn(async () => [
          { category: 'Arms', item: 'band' },
          { category: 'Legs', item: null },
        ]),
      },
    }

    const vocabulary = await listExerciseDraftClassificationVocabulary(
      prisma as never,
    )

    expect(vocabulary).toEqual({
      categories: ['Arms', 'Core', 'Legs'],
      items: ['band'],
    })
  })
})
