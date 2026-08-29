import {
  HIGHLIGHT_CARD_BODY_MAX_LENGTH,
  HIGHLIGHT_CARD_MAX_PER_COLLECTION,
  HIGHLIGHT_CARD_TITLE_MAX_LENGTH,
  type CreateHighlightCardInput,
  type HighlightCardCollection,
  type HighlightCardListItem,
  type RemoveHighlightCardInput,
  type ReorderHighlightCardInput,
  type UpdateHighlightCardInput,
} from '../../types/highlight-card.ts'
import { isRenderableLucideIcon, type LucideModule } from './lucide-icon.ts'

export type HighlightCardRecord = {
  id: string
  collection: HighlightCardCollection
  title: string
  body: string
  iconName: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type HighlightCardUpdateData = {
  title?: string
  body?: string
  iconName?: string
  sortOrder?: number
}

export type HighlightCardStore = {
  findById: (id: string) => Promise<HighlightCardRecord | null>
  create: (data: {
    id: string
    collection: HighlightCardCollection
    title: string
    body: string
    iconName: string
    sortOrder: number
  }) => Promise<HighlightCardRecord>
  update: (
    id: string,
    data: HighlightCardUpdateData,
  ) => Promise<HighlightCardRecord>
  deleteById: (id: string) => Promise<void>
  listAll: () => Promise<HighlightCardRecord[]>
  listByCollection: (
    collection: HighlightCardCollection,
  ) => Promise<HighlightCardRecord[]>
}

export class HighlightCardValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HighlightCardValidationError'
  }
}

export class HighlightCardNotFoundError extends Error {
  constructor(id: string) {
    super(`Highlight card "${id}" was not found.`)
    this.name = 'HighlightCardNotFoundError'
  }
}

export class HighlightCardCollectionFullError extends Error {
  constructor(collection: HighlightCardCollection) {
    super(
      `Highlight card collection "${collection}" already has the maximum of ${HIGHLIGHT_CARD_MAX_PER_COLLECTION} cards.`,
    )
    this.name = 'HighlightCardCollectionFullError'
  }
}

export function mapHighlightCardToListItem(
  record: HighlightCardRecord,
): HighlightCardListItem {
  return {
    id: record.id,
    collection: record.collection,
    title: record.title,
    body: record.body,
    iconName: record.iconName,
    sortOrder: record.sortOrder,
  }
}

function sortHighlightCardsByOrder(
  records: readonly HighlightCardRecord[],
): HighlightCardRecord[] {
  return [...records].sort((left, right) => left.sortOrder - right.sortOrder)
}

function normalizeHighlightCardFields(
  input: Pick<CreateHighlightCardInput, 'title' | 'body' | 'iconName'>,
  lucideModule: LucideModule,
): { title: string; body: string; iconName: string } {
  const title = input.title.trim()
  const body = input.body.trim()
  const iconName = input.iconName.trim()

  if (!title) {
    throw new HighlightCardValidationError('Title cannot be empty.')
  }

  if (title.length > HIGHLIGHT_CARD_TITLE_MAX_LENGTH) {
    throw new HighlightCardValidationError(
      `Title cannot exceed ${HIGHLIGHT_CARD_TITLE_MAX_LENGTH} characters.`,
    )
  }

  if (!body) {
    throw new HighlightCardValidationError('Body cannot be empty.')
  }

  if (body.length > HIGHLIGHT_CARD_BODY_MAX_LENGTH) {
    throw new HighlightCardValidationError(
      `Body cannot exceed ${HIGHLIGHT_CARD_BODY_MAX_LENGTH} characters.`,
    )
  }

  if (!iconName) {
    throw new HighlightCardValidationError('Icon name cannot be empty.')
  }

  if (!isRenderableLucideIcon(iconName, lucideModule)) {
    throw new HighlightCardValidationError(
      `Icon name "${iconName}" is not a renderable Lucide icon.`,
    )
  }

  return {
    title,
    body,
    iconName,
  }
}

export async function listHighlightCards(
  store: HighlightCardStore,
  collection?: HighlightCardCollection,
): Promise<HighlightCardListItem[]> {
  const records = collection
    ? await store.listByCollection(collection)
    : await store.listAll()

  return sortHighlightCardsByOrder(records).map(mapHighlightCardToListItem)
}

export async function createHighlightCard(
  store: HighlightCardStore,
  deps: {
    generateId: () => string
    lucideModule: LucideModule
  },
  input: CreateHighlightCardInput,
): Promise<HighlightCardListItem> {
  const normalized = normalizeHighlightCardFields(input, deps.lucideModule)
  const existingCards = await store.listByCollection(input.collection)

  if (existingCards.length >= HIGHLIGHT_CARD_MAX_PER_COLLECTION) {
    throw new HighlightCardCollectionFullError(input.collection)
  }

  const sortOrder =
    existingCards.length === 0
      ? 0
      : Math.max(...existingCards.map((record) => record.sortOrder)) + 1

  const created = await store.create({
    id: deps.generateId(),
    collection: input.collection,
    ...normalized,
    sortOrder,
  })

  return mapHighlightCardToListItem(created)
}

export async function updateHighlightCard(
  store: HighlightCardStore,
  deps: {
    lucideModule: LucideModule
  },
  input: UpdateHighlightCardInput,
): Promise<HighlightCardListItem> {
  const existing = await store.findById(input.id)

  if (!existing) {
    throw new HighlightCardNotFoundError(input.id)
  }

  const normalized = normalizeHighlightCardFields(input, deps.lucideModule)

  const updated = await store.update(input.id, normalized)

  return mapHighlightCardToListItem(updated)
}

export async function reorderHighlightCard(
  store: HighlightCardStore,
  input: ReorderHighlightCardInput,
): Promise<HighlightCardListItem[]> {
  const existing = await store.findById(input.id)

  if (!existing) {
    throw new HighlightCardNotFoundError(input.id)
  }

  const collectionCards = sortHighlightCardsByOrder(
    await store.listByCollection(existing.collection),
  )
  const currentIndex = collectionCards.findIndex(
    (record) => record.id === input.id,
  )
  const offset = input.direction === 'up' ? -1 : 1
  const targetIndex = currentIndex + offset

  if (
    currentIndex === -1 ||
    targetIndex < 0 ||
    targetIndex >= collectionCards.length
  ) {
    return listHighlightCards(store, existing.collection)
  }

  const neighbor = collectionCards[targetIndex]!
  const currentSortOrder = existing.sortOrder
  const neighborSortOrder = neighbor.sortOrder

  await store.update(existing.id, { sortOrder: neighborSortOrder })
  await store.update(neighbor.id, { sortOrder: currentSortOrder })

  return listHighlightCards(store, existing.collection)
}

export async function removeHighlightCard(
  store: HighlightCardStore,
  input: RemoveHighlightCardInput,
): Promise<{ id: string }> {
  const record = await store.findById(input.id)

  if (!record) {
    throw new HighlightCardNotFoundError(input.id)
  }

  await store.deleteById(input.id)

  return { id: input.id }
}
