import { describe, expect, it, vi } from 'vitest'
import {
  assertExerciseEnableAllowed,
  assertExercisePairEnabledConsistency,
  assessExerciseProductionReadiness,
  buildExerciseDraftMediaObjectKey,
  collectDraftUnityNameReservations,
  checkExerciseDraftUnityNameOccupancy,
  collectExerciseWizardClassificationVocabulary,
  createEmptyExerciseDraft,
  deriveExerciseIdsFromDraft,
  deriveExerciseNamesFromDraft,
  deriveUnityStemFromDisplayName,
  discardExerciseDraft,
  ExerciseDraftExerciseIdError,
  ExerciseDraftExerciseIdOccupiedError,
  ExerciseDraftNameOccupiedError,
  ExerciseDraftNotFoundError,
  ExerciseDraftUnityStemError,
  ExerciseEnableValidationError,
  ExercisePairEnabledMismatchError,
  findOccupiedUnityNames,
  getEffectiveUnityStem,
  promoteExerciseDraft,
  resetUnityStemFromDisplayName,
  saveExerciseDraft,
  validateExerciseId,
  validateUnityStem,
  type ExerciseDraftRecord,
  type ExerciseDraftStore,
  type ExerciseEnableRow,
  type ExercisePromoteRow,
  type ExercisePromoteStore,
} from './exercise-draft.ts'

function createDraft(
  partial: Partial<ExerciseDraftRecord> & { id: string },
): ExerciseDraftRecord {
  return {
    createdBy: 'user-1',
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
    ...partial,
  }
}

function createDraftStore(
  initial: ExerciseDraftRecord[] = [],
): ExerciseDraftStore & { records: ExerciseDraftRecord[] } {
  const records = [...initial]

  return {
    records,
    findById: vi.fn(
      async (id: string) => records.find((r) => r.id === id) ?? null,
    ),
    listAll: vi.fn(async () => [...records]),
    create: vi.fn(async (record: ExerciseDraftRecord) => {
      records.push(record)
      return record
    }),
    update: vi.fn(async (id: string, data) => {
      const record = records.find((entry) => entry.id === id)
      if (!record) {
        throw new Error(`Draft ${id} not found`)
      }
      Object.assign(record, data)
      return record
    }),
    deleteById: vi.fn(async (id: string) => {
      const index = records.findIndex((entry) => entry.id === id)
      if (index >= 0) {
        records.splice(index, 1)
      }
    }),
  }
}

function createPromoteStore(
  options: {
    exerciseNames?: string[]
    exerciseIds?: string[]
    onPromote?: (input: {
      draftId: string
      rows: ExercisePromoteRow[]
    }) => Promise<ExercisePromoteRow[]>
  } = {},
): ExercisePromoteStore & {
  exercises: ExercisePromoteRow[]
  promoted: boolean
} {
  const exercises: ExercisePromoteRow[] = []
  let promoted = false

  return {
    exercises,
    promoted,
    listExerciseNames: vi.fn(async () => options.exerciseNames ?? []),
    listExerciseIds: vi.fn(async () => options.exerciseIds ?? []),
    promoteDraft: vi.fn(async (input) => {
      if (options.onPromote) {
        return options.onPromote(input)
      }

      promoted = true
      exercises.push(...input.rows)
      return input.rows
    }),
  }
}

const completeDraft = createDraft({
  id: 'draft-1',
  laterality: 'pair',
  exerciseId: '420',
  displayName: 'Bicep Curls',
  description: 'Curl both arms.',
  category: 'Upper body',
  image: 'https://cdn.virtality.app/exercises/thumbnail/bicep-curls-abc.jpg',
  video: 'https://cdn.virtality.app/exercises/bicep-curls-abc.mp4',
})

describe('exercise draft unity names', () => {
  it('derives a Unity stem from displayName by removing spaces', () => {
    expect(deriveUnityStemFromDisplayName('Bicep Curls')).toBe('BicepCurls')
  })

  it('adds _L and _R for a left and right pair', () => {
    expect(deriveExerciseNamesFromDraft(completeDraft)).toEqual([
      { name: 'BicepCurls_L', direction: 'Left' },
      { name: 'BicepCurls_R', direction: 'Right' },
    ])
  })

  it('uses an unsuffixed Unity name for a single entry', () => {
    expect(
      deriveExerciseNamesFromDraft({
        ...completeDraft,
        laterality: 'single',
      }),
    ).toEqual([{ name: 'BicepCurls', direction: 'Both' }])
  })

  it('rejects Unity stems that already end in _L or _R', () => {
    expect(validateUnityStem('ShoulderPress_L')).toMatch(/_L or _R/)
    expect(validateUnityStem('ShoulderPress_R')).toMatch(/_L or _R/)
  })

  it('keeps a manually edited stem when dirty-sticky is set', () => {
    const draft = createDraft({
      id: 'draft-sticky',
      displayName: 'New Display',
      unityStem: 'LegacyStem',
      unityStemDirty: true,
      laterality: 'single',
    })

    expect(getEffectiveUnityStem(draft)).toBe('LegacyStem')
    expect(deriveExerciseNamesFromDraft(draft)).toEqual([
      { name: 'LegacyStem', direction: 'Both' },
    ])
  })

  it('resets the stem from displayName when the admin chooses reset', () => {
    expect(
      resetUnityStemFromDisplayName({ displayName: 'Hamstring Curl' }),
    ).toEqual({
      unityStem: 'HamstringCurl',
      unityStemDirty: false,
    })
  })
})

describe('exercise draft exercise IDs', () => {
  it('accepts a positive whole number', () => {
    expect(validateExerciseId('420')).toBeNull()
  })

  it('rejects a blank ID and anything that is not a positive whole number', () => {
    expect(validateExerciseId('')).not.toBeNull()
    expect(validateExerciseId('   ')).not.toBeNull()
    expect(validateExerciseId('42a')).not.toBeNull()
    expect(validateExerciseId('0')).not.toBeNull()
    expect(validateExerciseId('-3')).not.toBeNull()
    expect(validateExerciseId('4.2')).not.toBeNull()
    expect(validateExerciseId('042')).not.toBeNull()
  })

  it('gives a pair the entered number and the next one', () => {
    expect(
      deriveExerciseIdsFromDraft({ laterality: 'pair', exerciseId: '420' }),
    ).toEqual(['420', '421'])
  })

  it('gives a single entry just the entered number', () => {
    expect(
      deriveExerciseIdsFromDraft({ laterality: 'single', exerciseId: '420' }),
    ).toEqual(['420'])
  })

  it('reserves nothing without a laterality or a valid ID', () => {
    expect(
      deriveExerciseIdsFromDraft({ laterality: null, exerciseId: '420' }),
    ).toEqual([])
    expect(
      deriveExerciseIdsFromDraft({ laterality: 'pair', exerciseId: '42a' }),
    ).toEqual([])
  })
})

describe('exercise draft name occupancy', () => {
  it('treats unnamed drafts as occupying no Unity keys', () => {
    expect(
      collectDraftUnityNameReservations(
        createDraft({ id: 'empty', displayName: '', laterality: 'pair' }),
      ),
    ).toEqual([])
  })

  it('detects collisions against catalog exercises and other named drafts', () => {
    const occupied = findOccupiedUnityNames({
      candidateNames: ['BicepCurls_L', 'BicepCurls_R'],
      exerciseNames: ['BicepCurls_L'],
      drafts: [
        createDraft({
          id: 'other',
          displayName: 'Bicep Curls',
          laterality: 'pair',
        }),
      ],
    })

    expect(occupied).toEqual(['BicepCurls_L', 'BicepCurls_R'])
  })
})

describe('exercise production readiness', () => {
  it('requires media and core fields but not item', () => {
    expect(
      assessExerciseProductionReadiness({
        displayName: 'Move',
        name: 'Move_L',
        category: 'Legs',
        direction: 'Left',
        description: 'Do the move.',
        image: 'https://cdn.virtality.app/a.jpg',
        video: 'https://cdn.virtality.app/a.mp4',
        item: null,
        id: 'x',
        enabled: false,
      }),
    ).toEqual({ ready: true })
  })

  it('treats trimmed-empty strings and null media as absent', () => {
    const result = assessExerciseProductionReadiness({
      displayName: '  ',
      name: 'Move',
      category: 'Legs',
      direction: 'Left',
      description: 'Desc',
      image: null,
      video: '   ',
      item: 'Band',
      id: 'x',
      enabled: false,
    })

    expect(result.ready).toBe(false)
    if (!result.ready) {
      expect(result.missing).toEqual(['displayName', 'image', 'video'])
    }
  })
})

describe('promote exercise draft', () => {
  it('writes one enabled row for a single entry', async () => {
    const singleDraft = createDraft({
      ...completeDraft,
      laterality: 'single',
    })
    const draftStore = createDraftStore([singleDraft])
    const promoteStore = createPromoteStore()

    const rows = await promoteExerciseDraft(draftStore, promoteStore, {
      draftId: singleDraft.id,
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      name: 'BicepCurls',
      direction: 'Both',
      enabled: true,
    })
  })

  it('writes two enabled rows with shared media for a pair', async () => {
    const draftStore = createDraftStore([completeDraft])
    const promoteStore = createPromoteStore()

    const rows = await promoteExerciseDraft(draftStore, promoteStore, {
      draftId: 'draft-1',
    })

    expect(rows).toHaveLength(2)
    expect(rows.every((row) => row.enabled)).toBe(true)
    expect(rows[0]?.image).toBe(completeDraft.image)
    expect(rows[1]?.video).toBe(completeDraft.video)
    expect(promoteStore.exercises).toHaveLength(2)
  })

  it('promotes all-or-nothing when the transaction fails', async () => {
    const draftStore = createDraftStore([completeDraft])
    const promoteStore = createPromoteStore({
      onPromote: async () => {
        throw new Error('db rollback')
      },
    })

    await expect(
      promoteExerciseDraft(draftStore, promoteStore, {
        draftId: 'draft-1',
      }),
    ).rejects.toThrow('db rollback')

    expect(draftStore.records).toHaveLength(1)
    expect(promoteStore.exercises).toHaveLength(0)
  })

  it('uses the admin exercise ID, plus the next number for a pair', async () => {
    const draftStore = createDraftStore([completeDraft])
    const promoteStore = createPromoteStore()

    const rows = await promoteExerciseDraft(draftStore, promoteStore, {
      draftId: 'draft-1',
    })

    expect(rows.map((row) => row.id)).toEqual(['420', '421'])
  })

  it('rejects promotion when the exercise ID is blank', async () => {
    const draftStore = createDraftStore([
      createDraft({ ...completeDraft, exerciseId: '' }),
    ])
    const promoteStore = createPromoteStore()

    await expect(
      promoteExerciseDraft(draftStore, promoteStore, {
        draftId: 'draft-1',
      }),
    ).rejects.toBeInstanceOf(ExerciseDraftExerciseIdError)
  })

  it('rejects promotion when the admin exercise ID is malformed', async () => {
    const draftStore = createDraftStore([
      createDraft({ ...completeDraft, exerciseId: '42a' }),
    ])
    const promoteStore = createPromoteStore()

    await expect(
      promoteExerciseDraft(draftStore, promoteStore, {
        draftId: 'draft-1',
      }),
    ).rejects.toBeInstanceOf(ExerciseDraftExerciseIdError)
  })

  it('rejects promotion when the exercise ID is already taken', async () => {
    const draftStore = createDraftStore([completeDraft])
    const promoteStore = createPromoteStore({
      exerciseIds: ['421'],
    })

    await expect(
      promoteExerciseDraft(draftStore, promoteStore, {
        draftId: 'draft-1',
      }),
    ).rejects.toBeInstanceOf(ExerciseDraftExerciseIdOccupiedError)
  })

  it('rejects promotion when Unity names are already taken', async () => {
    const draftStore = createDraftStore([completeDraft])
    const promoteStore = createPromoteStore({
      exerciseNames: ['BicepCurls_R'],
    })

    await expect(
      promoteExerciseDraft(draftStore, promoteStore, {
        draftId: 'draft-1',
      }),
    ).rejects.toBeInstanceOf(ExerciseDraftNameOccupiedError)
  })
})

describe('discard exercise draft', () => {
  it('removes the draft row without touching media fields on the record', async () => {
    const draftStore = createDraftStore([completeDraft])

    await discardExerciseDraft(draftStore, 'draft-1')

    expect(draftStore.records).toHaveLength(0)
    expect(completeDraft.image).toBeTruthy()
  })

  it('throws when the draft id is unknown', async () => {
    const draftStore = createDraftStore()

    await expect(
      discardExerciseDraft(draftStore, 'missing'),
    ).rejects.toBeInstanceOf(ExerciseDraftNotFoundError)
  })
})

describe('enable in console validation', () => {
  const incomplete: ExerciseEnableRow = {
    id: 'ex-1',
    name: 'Move_L',
    displayName: 'Move',
    category: 'Legs',
    direction: 'Left',
    description: '',
    image: null,
    video: null,
    item: null,
    enabled: false,
  }

  it('rejects enabling incomplete exercises', () => {
    expect(() => assertExerciseEnableAllowed(incomplete, true)).toThrow(
      ExerciseEnableValidationError,
    )
  })

  it('rejects mixed enabled flags on a left and right pair', () => {
    const pair: ExerciseEnableRow[] = [
      {
        ...incomplete,
        direction: 'Left',
        enabled: true,
        description: 'd',
        image: 'i',
        video: 'v',
      },
      {
        ...incomplete,
        id: 'ex-2',
        name: 'Move_R',
        direction: 'Right',
        enabled: false,
        description: 'd',
        image: 'i',
        video: 'v',
      },
    ]

    expect(() => assertExercisePairEnabledConsistency(pair)).toThrow(
      ExercisePairEnabledMismatchError,
    )
  })
})

describe('exercise draft media object keys', () => {
  it('builds media keys from displayName and ignores the Unity stem', () => {
    const fromDisplayName = buildExerciseDraftMediaObjectKey({
      targetPrefix: 'exercises/thumbnail/',
      displayName: 'Bicep Curls',
      extension: 'png',
      uniqueSuffix: 'abc12345',
      unityStem: 'DifferentStem',
    })

    const fromStemOnly = buildExerciseDraftMediaObjectKey({
      targetPrefix: 'exercises/thumbnail/',
      displayName: 'Ignored When Stem Differs',
      extension: 'png',
      uniqueSuffix: 'abc12345',
      unityStem: 'Bicep Curls',
    })

    expect(fromDisplayName).toBe('exercises/thumbnail/bicep-curls-abc12345.png')
    expect(fromStemOnly).toBe(
      'exercises/thumbnail/ignored-when-stem-differs-abc12345.png',
    )
  })
})

describe('save exercise draft', () => {
  it('persists field updates for an existing draft', async () => {
    const draftStore = createDraftStore([completeDraft])

    const updated = await saveExerciseDraft(draftStore, 'draft-1', {
      description: 'Updated copy.',
    })

    expect(updated.description).toBe('Updated copy.')
  })

  it('rejects stems that already encode laterality', async () => {
    const draftStore = createDraftStore([
      createDraft({
        id: 'draft-1',
        laterality: 'pair',
        displayName: 'Move',
        unityStem: 'Move_L',
        unityStemDirty: true,
      }),
    ])

    await expect(
      saveExerciseDraft(draftStore, 'draft-1', { displayName: 'Move' }),
    ).rejects.toBeInstanceOf(ExerciseDraftUnityStemError)
  })
})

describe('check exercise draft unity name occupancy', () => {
  it('returns occupied Unity names for the draft sitting', async () => {
    const draftStore = createDraftStore([completeDraft])

    const result = await checkExerciseDraftUnityNameOccupancy(
      draftStore,
      {
        listExerciseNames: async () => ['BicepCurls_L'],
        listExerciseIds: async () => [],
      },
      { draftId: 'draft-1' },
    )

    expect(result.occupiedNames).toEqual(['BicepCurls_L'])
    expect(result.occupiedExerciseIds).toEqual([])
  })

  it('returns occupied exercise IDs for the draft sitting', async () => {
    const draftStore = createDraftStore([completeDraft])

    const result = await checkExerciseDraftUnityNameOccupancy(
      draftStore,
      {
        listExerciseNames: async () => [],
        listExerciseIds: async () => ['420'],
      },
      { draftId: 'draft-1' },
    )

    expect(result.occupiedExerciseIds).toEqual(['420'])
  })
})

describe('exercise wizard classification vocabulary', () => {
  it('merges distinct categories and items from exercises and drafts', () => {
    const vocabulary = collectExerciseWizardClassificationVocabulary(
      [{ category: 'Legs', item: 'Band' }],
      [
        { category: 'Arms', item: null },
        { category: 'Legs', item: 'band' },
      ],
    )

    expect(vocabulary).toEqual({
      categories: ['Arms', 'Legs'],
      items: ['band'],
    })
  })
})

describe('create empty exercise draft', () => {
  it('inserts an empty setting attributed to the creator', async () => {
    const store = createDraftStore()
    const draft = await createEmptyExerciseDraft(store, {
      id: 'draft-new',
      createdBy: 'admin-1',
    })

    expect(draft).toMatchObject({
      id: 'draft-new',
      createdBy: 'admin-1',
      laterality: null,
      displayName: '',
    })
    expect(store.records).toHaveLength(1)
  })
})
