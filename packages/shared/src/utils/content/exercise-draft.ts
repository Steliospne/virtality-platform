import type { ExerciseDraftLaterality } from '../../types/exercise-draft.ts'
import { normalizeExerciseEquipmentKey } from '../clinical/normalize-exercise-equipment-key.ts'
import { buildBucketObjectKey } from './bucket.ts'

export type ExerciseDraftRecord = {
  id: string
  createdBy: string
  laterality: ExerciseDraftLaterality | null
  exerciseId: string
  displayName: string
  unityStem: string
  unityStemDirty: boolean
  description: string
  category: string
  item: string | null
  image: string | null
  video: string | null
}

export type ExerciseDraftStore = {
  findById: (id: string) => Promise<ExerciseDraftRecord | null>
  listAll: () => Promise<ExerciseDraftRecord[]>
  create: (record: ExerciseDraftRecord) => Promise<ExerciseDraftRecord>
  update: (
    id: string,
    data: Partial<Omit<ExerciseDraftRecord, 'id' | 'createdBy'>>,
  ) => Promise<ExerciseDraftRecord>
  deleteById: (id: string) => Promise<void>
}

export type ExercisePromoteRow = {
  id: string
  name: string
  displayName: string
  category: string
  direction: string
  item: string | null
  image: string
  video: string
  description: string
  enabled: boolean
}

export type ExercisePromoteStore = {
  listExerciseNames: () => Promise<string[]>
  listExerciseIds: () => Promise<string[]>
  promoteDraft: (input: {
    draftId: string
    rows: ExercisePromoteRow[]
  }) => Promise<ExercisePromoteRow[]>
}

export type ExerciseEnableRow = {
  id: string
  name: string
  displayName: string
  category: string
  direction: string
  item: string | null
  image: string | null
  video: string | null
  description: string
  enabled: boolean
}

export class ExerciseDraftNotFoundError extends Error {
  constructor(id: string) {
    super(`Exercise draft ${id} was not found.`)
    this.name = 'ExerciseDraftNotFoundError'
  }
}

export class ExerciseDraftUnityStemError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExerciseDraftUnityStemError'
  }
}

export class ExerciseDraftNameOccupiedError extends Error {
  readonly occupiedNames: string[]

  constructor(occupiedNames: string[]) {
    super(
      occupiedNames.length === 1
        ? `Unity name ${occupiedNames[0]} is already in use.`
        : `Unity names ${occupiedNames.join(', ')} are already in use.`,
    )
    this.name = 'ExerciseDraftNameOccupiedError'
    this.occupiedNames = occupiedNames
  }
}

export class ExerciseDraftExerciseIdError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExerciseDraftExerciseIdError'
  }
}

export class ExerciseDraftExerciseIdOccupiedError extends Error {
  readonly occupiedExerciseIds: string[]

  constructor(occupiedExerciseIds: string[]) {
    super(
      occupiedExerciseIds.length === 1
        ? `Exercise ID ${occupiedExerciseIds[0]} is already in use.`
        : `Exercise IDs ${occupiedExerciseIds.join(', ')} are already in use.`,
    )
    this.name = 'ExerciseDraftExerciseIdOccupiedError'
    this.occupiedExerciseIds = occupiedExerciseIds
  }
}

export class ExerciseDraftPromoteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExerciseDraftPromoteError'
  }
}

export class ExerciseEnableValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExerciseEnableValidationError'
  }
}

export class ExercisePairEnabledMismatchError extends Error {
  constructor(displayName: string) {
    super(
      `Exercise family "${displayName}" cannot mix enabled flags across Left and Right.`,
    )
    this.name = 'ExercisePairEnabledMismatchError'
  }
}

export type ExerciseProductionReadiness =
  | { ready: true }
  | { ready: false; missing: string[] }

const UNITY_SUFFIX_PATTERN = /_(L|R)$/

export function deriveUnityStemFromDisplayName(displayName: string): string {
  return displayName.replace(/\s+/g, '')
}

export function validateUnityStem(stem: string): string | null {
  const trimmed = stem.trim()
  if (!trimmed) {
    return 'Unity stem cannot be empty.'
  }

  if (UNITY_SUFFIX_PATTERN.test(trimmed)) {
    return 'Unity stem cannot end with _L or _R; laterality adds those suffixes.'
  }

  return null
}

export function getEffectiveUnityStem(
  draft: Pick<
    ExerciseDraftRecord,
    'displayName' | 'unityStem' | 'unityStemDirty'
  >,
): string {
  if (draft.unityStemDirty) {
    return draft.unityStem.trim()
  }

  return deriveUnityStemFromDisplayName(draft.displayName.trim())
}

export function resetUnityStemFromDisplayName(
  draft: Pick<ExerciseDraftRecord, 'displayName'>,
): Pick<ExerciseDraftRecord, 'unityStem' | 'unityStemDirty'> {
  return {
    unityStem: deriveUnityStemFromDisplayName(draft.displayName.trim()),
    unityStemDirty: false,
  }
}

export type DerivedExerciseDraftName = {
  name: string
  direction: string
}

export function deriveExerciseNamesFromDraft(
  draft: Pick<
    ExerciseDraftRecord,
    'laterality' | 'displayName' | 'unityStem' | 'unityStemDirty'
  >,
): DerivedExerciseDraftName[] {
  if (!draft.laterality) {
    return []
  }

  const stem = getEffectiveUnityStem(draft)
  const stemError = validateUnityStem(stem)
  if (stemError) {
    return []
  }

  if (draft.laterality === 'pair') {
    return [
      { name: `${stem}_L`, direction: 'Left' },
      { name: `${stem}_R`, direction: 'Right' },
    ]
  }

  return [{ name: stem, direction: 'Both' }]
}

const EXERCISE_ID_PATTERN = /^[1-9][0-9]*$/

export function validateExerciseId(exerciseId: string): string | null {
  const trimmed = exerciseId.trim()
  if (!trimmed) {
    return 'Exercise ID is required.'
  }

  if (!EXERCISE_ID_PATTERN.test(trimmed)) {
    return 'Exercise ID must be a positive whole number, matching the Exercise row ID.'
  }

  if (!Number.isSafeInteger(Number(trimmed))) {
    return 'Exercise ID is too large.'
  }

  return null
}

/**
 * A pair occupies two consecutive row IDs: the entered number and the next one.
 */
export function deriveExerciseIdsFromDraft(
  draft: Pick<ExerciseDraftRecord, 'laterality' | 'exerciseId'>,
): string[] {
  const trimmed = draft.exerciseId.trim()
  if (!draft.laterality || !trimmed || validateExerciseId(trimmed)) {
    return []
  }

  if (draft.laterality === 'pair') {
    return [trimmed, String(Number(trimmed) + 1)]
  }

  return [trimmed]
}

export function findOccupiedExerciseIds({
  candidateExerciseIds,
  exerciseIds,
  drafts,
  excludeDraftId,
}: {
  candidateExerciseIds: string[]
  exerciseIds: readonly string[]
  drafts: readonly ExerciseDraftRecord[]
  excludeDraftId?: string
}): string[] {
  const occupied = new Set<string>()
  const exerciseIdSet = new Set(exerciseIds)
  const candidateSet = new Set(candidateExerciseIds)

  for (const exerciseId of candidateExerciseIds) {
    if (exerciseIdSet.has(exerciseId)) {
      occupied.add(exerciseId)
    }
  }

  for (const draft of drafts) {
    if (draft.id === excludeDraftId) {
      continue
    }

    for (const reserved of deriveExerciseIdsFromDraft(draft)) {
      if (candidateSet.has(reserved)) {
        occupied.add(reserved)
      }
    }
  }

  return [...occupied].sort((left, right) => Number(left) - Number(right))
}

export function collectDraftUnityNameReservations(
  draft: Pick<
    ExerciseDraftRecord,
    'laterality' | 'displayName' | 'unityStem' | 'unityStemDirty'
  >,
): string[] {
  if (!draft.displayName.trim()) {
    return []
  }

  return deriveExerciseNamesFromDraft(draft).map((entry) => entry.name)
}

export function findOccupiedUnityNames({
  candidateNames,
  exerciseNames,
  drafts,
  excludeDraftId,
}: {
  candidateNames: string[]
  exerciseNames: readonly string[]
  drafts: readonly ExerciseDraftRecord[]
  excludeDraftId?: string
}): string[] {
  const occupied = new Set<string>()
  const exerciseNameSet = new Set(exerciseNames)
  const candidateNameSet = new Set(candidateNames)

  for (const name of candidateNames) {
    if (exerciseNameSet.has(name)) {
      occupied.add(name)
    }
  }

  for (const draft of drafts) {
    if (draft.id === excludeDraftId) {
      continue
    }

    for (const reserved of collectDraftUnityNameReservations(draft)) {
      if (candidateNameSet.has(reserved)) {
        occupied.add(reserved)
      }
    }
  }

  return [...occupied].sort((left, right) => left.localeCompare(right))
}

function trimmedPresent(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function assessExerciseProductionReadiness(
  exercise: Pick<
    ExerciseEnableRow,
    | 'displayName'
    | 'name'
    | 'category'
    | 'direction'
    | 'description'
    | 'image'
    | 'video'
  >,
): ExerciseProductionReadiness {
  const requiredFields = [
    'displayName',
    'name',
    'category',
    'direction',
    'description',
    'image',
    'video',
  ] as const satisfies ReadonlyArray<
    keyof Pick<
      ExerciseEnableRow,
      | 'displayName'
      | 'name'
      | 'category'
      | 'direction'
      | 'description'
      | 'image'
      | 'video'
    >
  >

  const missing = requiredFields.filter(
    (field) => !trimmedPresent(exercise[field]),
  )

  if (missing.length > 0) {
    return { ready: false, missing }
  }

  return { ready: true }
}

export function assertExerciseEnableAllowed(
  exercise: ExerciseEnableRow,
  nextEnabled: boolean,
): void {
  if (!nextEnabled) {
    return
  }

  const readiness = assessExerciseProductionReadiness(exercise)
  if (!readiness.ready) {
    throw new ExerciseEnableValidationError(
      `Cannot enable exercise ${exercise.name}: missing ${readiness.missing.join(', ')}.`,
    )
  }
}

export function assertExercisePairEnabledConsistency(
  exercises: readonly ExerciseEnableRow[],
): void {
  const byFamily = new Map<string, ExerciseEnableRow[]>()

  for (const exercise of exercises) {
    const familyKey = exercise.displayName.trim()
    const members = byFamily.get(familyKey) ?? []
    members.push(exercise)
    byFamily.set(familyKey, members)
  }

  for (const [familyKey, members] of byFamily) {
    const left = members.find((member) => member.direction === 'Left')
    const right = members.find((member) => member.direction === 'Right')

    if (!left || !right) {
      continue
    }

    if (left.enabled !== right.enabled) {
      throw new ExercisePairEnabledMismatchError(familyKey)
    }
  }
}

function buildPromoteRowsFromDraft(
  draft: ExerciseDraftRecord,
): ExercisePromoteRow[] {
  const derivedNames = deriveExerciseNamesFromDraft(draft)
  if (derivedNames.length === 0) {
    throw new ExerciseDraftPromoteError(
      'Draft laterality and Unity stem are required before promotion.',
    )
  }

  const stemError = validateUnityStem(getEffectiveUnityStem(draft))
  if (stemError) {
    throw new ExerciseDraftUnityStemError(stemError)
  }

  const exerciseIdError = validateExerciseId(draft.exerciseId)
  if (exerciseIdError) {
    throw new ExerciseDraftExerciseIdError(exerciseIdError)
  }

  const exerciseIds = deriveExerciseIdsFromDraft(draft)
  if (exerciseIds.length !== derivedNames.length) {
    throw new ExerciseDraftPromoteError(
      'Draft exercise ID could not be resolved for every row.',
    )
  }

  const shared = {
    displayName: draft.displayName.trim(),
    category: draft.category.trim(),
    item: draft.item?.trim() ? draft.item.trim() : null,
    image: draft.image?.trim() ?? '',
    video: draft.video?.trim() ?? '',
    description: draft.description.trim(),
    enabled: true,
  }

  return derivedNames.map((entry, index) => ({
    id: exerciseIds[index]!,
    name: entry.name,
    direction: entry.direction,
    ...shared,
  }))
}

export async function saveExerciseDraft(
  store: ExerciseDraftStore,
  draftId: string,
  data: Partial<Omit<ExerciseDraftRecord, 'id' | 'createdBy'>>,
): Promise<ExerciseDraftRecord> {
  const existing = await store.findById(draftId)
  if (!existing) {
    throw new ExerciseDraftNotFoundError(draftId)
  }

  const merged: ExerciseDraftRecord = { ...existing, ...data }
  const stemFieldsChanged =
    data.displayName !== undefined ||
    data.laterality !== undefined ||
    data.unityStem !== undefined ||
    data.unityStemDirty !== undefined

  if (stemFieldsChanged && merged.laterality) {
    const stemError = validateUnityStem(getEffectiveUnityStem(merged))
    if (stemError) {
      throw new ExerciseDraftUnityStemError(stemError)
    }
  }

  return store.update(draftId, data)
}

export type ExerciseNameOccupancyReader = {
  listExerciseNames: () => Promise<string[]>
  listExerciseIds: () => Promise<string[]>
}

export async function checkExerciseDraftUnityNameOccupancy(
  draftStore: ExerciseDraftStore,
  occupancyReader: ExerciseNameOccupancyReader,
  input: {
    draftId: string
    candidateNames?: string[]
    candidateExerciseIds?: string[]
  },
): Promise<{ occupiedNames: string[]; occupiedExerciseIds: string[] }> {
  const draft = await draftStore.findById(input.draftId)
  if (!draft) {
    throw new ExerciseDraftNotFoundError(input.draftId)
  }

  const candidateNames =
    input.candidateNames ??
    deriveExerciseNamesFromDraft(draft).map((entry) => entry.name)
  const candidateExerciseIds =
    input.candidateExerciseIds ?? deriveExerciseIdsFromDraft(draft)

  if (candidateNames.length === 0 && candidateExerciseIds.length === 0) {
    return { occupiedNames: [], occupiedExerciseIds: [] }
  }

  const [exerciseNames, exerciseIds, drafts] = await Promise.all([
    occupancyReader.listExerciseNames(),
    occupancyReader.listExerciseIds(),
    draftStore.listAll(),
  ])

  const occupiedNames = findOccupiedUnityNames({
    candidateNames,
    exerciseNames,
    drafts,
    excludeDraftId: draft.id,
  })

  const occupiedExerciseIds = findOccupiedExerciseIds({
    candidateExerciseIds,
    exerciseIds,
    drafts,
    excludeDraftId: draft.id,
  })

  return { occupiedNames, occupiedExerciseIds }
}

export function collectExerciseWizardClassificationVocabulary(
  exercises: readonly { category: string; item: string | null }[],
  drafts: readonly { category: string; item: string | null }[],
): { categories: string[]; items: string[] } {
  const categories = new Set<string>()
  const items = new Set<string>()

  for (const row of [...exercises, ...drafts]) {
    const category = row.category.trim()
    if (category) {
      categories.add(category)
    }

    const item = row.item?.trim()
    if (item) {
      items.add(normalizeExerciseEquipmentKey(item))
    }
  }

  return {
    categories: [...categories].sort((left, right) =>
      left.localeCompare(right),
    ),
    items: [...items].sort((left, right) => left.localeCompare(right)),
  }
}

export async function createEmptyExerciseDraft(
  store: ExerciseDraftStore,
  input: { id: string; createdBy: string },
): Promise<ExerciseDraftRecord> {
  const record: ExerciseDraftRecord = {
    id: input.id,
    createdBy: input.createdBy,
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
  }

  return store.create(record)
}

export async function discardExerciseDraft(
  store: ExerciseDraftStore,
  draftId: string,
): Promise<void> {
  const draft = await store.findById(draftId)
  if (!draft) {
    throw new ExerciseDraftNotFoundError(draftId)
  }

  await store.deleteById(draftId)
}

export async function promoteExerciseDraft(
  draftStore: ExerciseDraftStore,
  promoteStore: ExercisePromoteStore,
  input: { draftId: string },
): Promise<ExercisePromoteRow[]> {
  const draft = await draftStore.findById(input.draftId)
  if (!draft) {
    throw new ExerciseDraftNotFoundError(input.draftId)
  }

  const rows = buildPromoteRowsFromDraft(draft)

  for (const row of rows) {
    const readiness = assessExerciseProductionReadiness(row)
    if (!readiness.ready) {
      throw new ExerciseDraftPromoteError(
        `Cannot promote draft: missing ${readiness.missing.join(', ')}.`,
      )
    }
  }

  const candidateNames = rows.map((row) => row.name)
  const [exerciseNames, exerciseIds, drafts] = await Promise.all([
    promoteStore.listExerciseNames(),
    promoteStore.listExerciseIds(),
    draftStore.listAll(),
  ])
  const occupied = findOccupiedUnityNames({
    candidateNames,
    exerciseNames,
    drafts,
    excludeDraftId: draft.id,
  })

  if (occupied.length > 0) {
    throw new ExerciseDraftNameOccupiedError(occupied)
  }

  const occupiedExerciseIds = findOccupiedExerciseIds({
    candidateExerciseIds: deriveExerciseIdsFromDraft(draft),
    exerciseIds,
    drafts,
    excludeDraftId: draft.id,
  })

  if (occupiedExerciseIds.length > 0) {
    throw new ExerciseDraftExerciseIdOccupiedError(occupiedExerciseIds)
  }

  return promoteStore.promoteDraft({
    draftId: draft.id,
    rows,
  })
}

export function buildExerciseDraftMediaObjectKey({
  targetPrefix,
  displayName,
  extension,
  uniqueSuffix,
}: {
  targetPrefix: string
  displayName: string
  extension: string
  uniqueSuffix: string
  /** Ignored; media keys are derived from displayName only. */
  unityStem?: string
}): string {
  const trimmedDisplayName = displayName.trim()
  const syntheticFilename = extension
    ? `${trimmedDisplayName}.${extension}`
    : trimmedDisplayName

  return buildBucketObjectKey({
    targetPrefix,
    originalFilename: syntheticFilename,
    uniqueSuffix,
  })
}
