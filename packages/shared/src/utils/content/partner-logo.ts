import {
  partnerLogoCategorySchema,
  type CreatePartnerLogoInput,
  type PartnerLogoCategory,
  type PartnerLogoListItem,
  type ReorderPartnerLogoInput,
  type RemovePartnerLogoInput,
  type UpdatePartnerLogoInput,
} from '../../types/partner-logo.ts'
import { bucketCdnUrl, validateBucketObjectKey } from './bucket.ts'

export type PartnerLogoRecord = {
  id: string
  objectKey: string
  alt: string
  category: PartnerLogoCategory
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type PartnerLogoUpdateData = {
  objectKey?: string
  alt?: string
  category?: PartnerLogoCategory
  sortOrder?: number
}

export type PartnerLogoStore = {
  findById: (id: string) => Promise<PartnerLogoRecord | null>
  findByObjectKey: (objectKey: string) => Promise<PartnerLogoRecord | null>
  findMaxSortOrder: (category: PartnerLogoCategory) => Promise<number | null>
  create: (data: {
    id: string
    objectKey: string
    alt: string
    category: PartnerLogoCategory
    sortOrder: number
  }) => Promise<PartnerLogoRecord>
  update: (
    id: string,
    data: PartnerLogoUpdateData,
  ) => Promise<PartnerLogoRecord>
  deleteById: (id: string) => Promise<void>
  listAll: () => Promise<PartnerLogoRecord[]>
}

export type PartnerLogoBucketDeleter = {
  deleteObject: (objectKey: string) => Promise<void>
}

export type RemovePartnerLogoOutcome = {
  id: string
  objectKey: string
  bucketObjectDeleted: boolean
}

export class PartnerLogoObjectKeyAlreadyAssignedError extends Error {
  constructor(objectKey: string) {
    super(`Object key "${objectKey}" is already assigned to a partner logo.`)
    this.name = 'PartnerLogoObjectKeyAlreadyAssignedError'
  }
}

export class PartnerLogoValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PartnerLogoValidationError'
  }
}

export class PartnerLogoNotFoundError extends Error {
  constructor(id: string) {
    super(`Partner logo "${id}" was not found.`)
    this.name = 'PartnerLogoNotFoundError'
  }
}

const CATEGORY_ORDER = Object.fromEntries(
  partnerLogoCategorySchema.options.map((category, index) => [category, index]),
) as Record<PartnerLogoCategory, number>

export function comparePartnerLogosForList(
  left: Pick<PartnerLogoRecord, 'category' | 'sortOrder'>,
  right: Pick<PartnerLogoRecord, 'category' | 'sortOrder'>,
): number {
  const categoryCompare =
    CATEGORY_ORDER[left.category] - CATEGORY_ORDER[right.category]

  if (categoryCompare !== 0) {
    return categoryCompare
  }

  return left.sortOrder - right.sortOrder
}

export function mapPartnerLogoToListItem(
  record: PartnerLogoRecord,
): PartnerLogoListItem {
  return {
    id: record.id,
    objectKey: record.objectKey,
    alt: record.alt,
    category: record.category,
    sortOrder: record.sortOrder,
    cdnUrl: bucketCdnUrl(record.objectKey),
  }
}

export async function listPartnerLogos(
  store: PartnerLogoStore,
): Promise<PartnerLogoListItem[]> {
  const records = await store.listAll()

  return [...records]
    .sort(comparePartnerLogosForList)
    .map(mapPartnerLogoToListItem)
}

function normalizePartnerLogoFields(
  input: Pick<CreatePartnerLogoInput, 'objectKey' | 'alt' | 'category'>,
) {
  const objectKey = input.objectKey.trim()
  const alt = input.alt.trim()
  const objectKeyError = validateBucketObjectKey(objectKey)

  if (objectKeyError) {
    throw new PartnerLogoValidationError(objectKeyError)
  }

  if (!alt) {
    throw new PartnerLogoValidationError('Alt text cannot be empty.')
  }

  return {
    objectKey,
    alt,
    category: input.category,
  }
}

function getCategoryLogosOrdered(
  records: readonly PartnerLogoRecord[],
  category: PartnerLogoCategory,
): PartnerLogoRecord[] {
  return records
    .filter((record) => record.category === category)
    .sort((left, right) => left.sortOrder - right.sortOrder)
}

export async function createPartnerLogo(
  store: PartnerLogoStore,
  deps: { generateId: () => string },
  input: CreatePartnerLogoInput,
): Promise<PartnerLogoListItem> {
  const normalized = normalizePartnerLogoFields(input)
  const existing = await store.findByObjectKey(normalized.objectKey)

  if (existing) {
    throw new PartnerLogoObjectKeyAlreadyAssignedError(normalized.objectKey)
  }

  const maxSortOrder = await store.findMaxSortOrder(normalized.category)
  const sortOrder = (maxSortOrder ?? -1) + 1

  const created = await store.create({
    id: deps.generateId(),
    ...normalized,
    sortOrder,
  })

  return mapPartnerLogoToListItem(created)
}

export async function updatePartnerLogo(
  store: PartnerLogoStore,
  input: UpdatePartnerLogoInput,
): Promise<PartnerLogoListItem> {
  const existing = await store.findById(input.id)

  if (!existing) {
    throw new PartnerLogoNotFoundError(input.id)
  }

  const normalized = normalizePartnerLogoFields(input)

  if (normalized.objectKey !== existing.objectKey) {
    const conflict = await store.findByObjectKey(normalized.objectKey)

    if (conflict && conflict.id !== existing.id) {
      throw new PartnerLogoObjectKeyAlreadyAssignedError(normalized.objectKey)
    }
  }

  let sortOrder = existing.sortOrder

  if (normalized.category !== existing.category) {
    const maxSortOrder = await store.findMaxSortOrder(normalized.category)
    sortOrder = (maxSortOrder ?? -1) + 1
  }

  const updated = await store.update(input.id, {
    objectKey: normalized.objectKey,
    alt: normalized.alt,
    category: normalized.category,
    sortOrder,
  })

  return mapPartnerLogoToListItem(updated)
}

export async function reorderPartnerLogo(
  store: PartnerLogoStore,
  input: ReorderPartnerLogoInput,
): Promise<PartnerLogoListItem[]> {
  const existing = await store.findById(input.id)

  if (!existing) {
    throw new PartnerLogoNotFoundError(input.id)
  }

  const categoryLogos = getCategoryLogosOrdered(
    await store.listAll(),
    existing.category,
  )
  const currentIndex = categoryLogos.findIndex(
    (record) => record.id === input.id,
  )
  let targetIndex: number
  if (input.direction === 'up') {
    targetIndex = currentIndex - 1
  } else {
    targetIndex = currentIndex + 1
  }

  if (
    currentIndex === -1 ||
    targetIndex < 0 ||
    targetIndex >= categoryLogos.length
  ) {
    return listPartnerLogos(store)
  }

  const neighbor = categoryLogos[targetIndex]!
  const currentSortOrder = existing.sortOrder
  const neighborSortOrder = neighbor.sortOrder

  await store.update(existing.id, { sortOrder: neighborSortOrder })
  await store.update(neighbor.id, { sortOrder: currentSortOrder })

  return listPartnerLogos(store)
}

export async function removePartnerLogo(
  store: PartnerLogoStore,
  deps: {
    deleteBucketObject?: PartnerLogoBucketDeleter
  },
  input: RemovePartnerLogoInput,
): Promise<RemovePartnerLogoOutcome> {
  const record = await store.findById(input.id)

  if (!record) {
    throw new PartnerLogoNotFoundError(input.id)
  }

  const { objectKey } = record
  await store.deleteById(input.id)

  if (input.alsoDeleteBucketObject) {
    if (!deps.deleteBucketObject) {
      throw new Error(
        'Bucket object deleter is required when alsoDeleteBucketObject is true.',
      )
    }

    await deps.deleteBucketObject.deleteObject(objectKey)
  }

  return {
    id: input.id,
    objectKey,
    bucketObjectDeleted: Boolean(input.alsoDeleteBucketObject),
  }
}
