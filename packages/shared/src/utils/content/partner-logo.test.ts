import { describe, expect, it, vi } from 'vitest'
import type { PartnerLogoCategory } from '../../types/partner-logo.ts'
import {
  comparePartnerLogosForList,
  createPartnerLogo,
  listPartnerLogos,
  PartnerLogoNotFoundError,
  PartnerLogoObjectKeyAlreadyAssignedError,
  removePartnerLogo,
  reorderPartnerLogo,
  updatePartnerLogo,
  type PartnerLogoRecord,
  type PartnerLogoStore,
  type PartnerLogoUpdateData,
} from './partner-logo.ts'

const now = new Date('2026-07-17T12:00:00.000Z')

function createStore(
  initialRecords: PartnerLogoRecord[] = [],
): PartnerLogoStore & { records: PartnerLogoRecord[] } {
  const records = [...initialRecords]

  return {
    records,
    findById: vi.fn(
      async (id: string) => records.find((record) => record.id === id) ?? null,
    ),
    findByObjectKey: vi.fn(
      async (objectKey: string) =>
        records.find((record) => record.objectKey === objectKey) ?? null,
    ),
    findMaxSortOrder: vi.fn(async (category: PartnerLogoCategory) => {
      const categoryRecords = records.filter(
        (record) => record.category === category,
      )
      if (categoryRecords.length === 0) {
        return null
      }

      return Math.max(...categoryRecords.map((record) => record.sortOrder))
    }),
    deleteById: vi.fn(async (id: string) => {
      const index = records.findIndex((record) => record.id === id)
      if (index === -1) {
        return
      }

      records.splice(index, 1)
    }),
    create: vi.fn(
      async (data: {
        id: string
        objectKey: string
        alt: string
        category: PartnerLogoCategory
        sortOrder: number
      }) => {
        const record: PartnerLogoRecord = {
          ...data,
          createdAt: now,
          updatedAt: now,
        }
        records.push(record)
        return record
      },
    ),
    update: vi.fn(async (id: string, data: PartnerLogoUpdateData) => {
      const record = records.find((entry) => entry.id === id)
      if (!record) {
        throw new Error(`Record ${id} not found`)
      }

      Object.assign(record, data, { updatedAt: now })
      return record
    }),
    listAll: vi.fn(async () => [...records]),
  }
}

describe('partner logo domain', () => {
  it('rejects duplicate objectKey assignments', async () => {
    const store = createStore([
      {
        id: 'logo-1',
        objectKey: 'marketing/logos/strategic/acme.png',
        alt: 'Acme',
        category: 'strategic',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
    ])

    await expect(
      createPartnerLogo(
        store,
        {
          generateId: () => 'logo-2',
        },
        {
          objectKey: 'marketing/logos/strategic/acme.png',
          alt: 'Duplicate',
          category: 'clinical',
        },
      ),
    ).rejects.toBeInstanceOf(PartnerLogoObjectKeyAlreadyAssignedError)
  })

  it('appends new logos to the end of their category sort order', async () => {
    const store = createStore([
      {
        id: 'logo-1',
        objectKey: 'marketing/logos/strategic/a.png',
        alt: 'A',
        category: 'strategic',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'logo-2',
        objectKey: 'marketing/logos/clinical/b.png',
        alt: 'B',
        category: 'clinical',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
    ])

    const created = await createPartnerLogo(
      store,
      { generateId: () => 'logo-3' },
      {
        objectKey: 'marketing/logos/strategic/c.png',
        alt: 'C',
        category: 'strategic',
      },
    )

    expect(created.sortOrder).toBe(1)
  })

  it('lists logos ordered by category then sortOrder with CDN URLs derived at read time', async () => {
    const store = createStore([
      {
        id: 'logo-1',
        objectKey: 'marketing/logos/clinical/second-clinical.png',
        alt: 'Clinical two',
        category: 'clinical',
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'logo-2',
        objectKey: 'marketing/logos/strategic/second-strategic.png',
        alt: 'Strategic two',
        category: 'strategic',
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'logo-3',
        objectKey: 'marketing/logos/clinical/first-clinical.png',
        alt: 'Clinical one',
        category: 'clinical',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'logo-4',
        objectKey: 'marketing/logos/strategic/first-strategic.png',
        alt: 'Strategic one',
        category: 'strategic',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
    ])

    const listed = await listPartnerLogos(store)

    expect(listed.map((item) => item.objectKey)).toEqual([
      'marketing/logos/strategic/first-strategic.png',
      'marketing/logos/strategic/second-strategic.png',
      'marketing/logos/clinical/first-clinical.png',
      'marketing/logos/clinical/second-clinical.png',
    ])
    expect(listed[0]?.cdnUrl).toMatch(
      /marketing\/logos\/strategic\/first-strategic\.png$/,
    )
  })

  it('removes the assignment by default without deleting the bucket object', async () => {
    const store = createStore([
      {
        id: 'logo-1',
        objectKey: 'marketing/logos/strategic/acme.png',
        alt: 'Acme',
        category: 'strategic',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
    ])
    const deleteBucketObject = vi.fn(async () => undefined)

    const outcome = await removePartnerLogo(
      store,
      { deleteBucketObject: { deleteObject: deleteBucketObject } },
      { id: 'logo-1' },
    )

    expect(outcome).toEqual({
      id: 'logo-1',
      objectKey: 'marketing/logos/strategic/acme.png',
      bucketObjectDeleted: false,
    })
    expect(store.records).toHaveLength(0)
    expect(deleteBucketObject).not.toHaveBeenCalled()
    await expect(listPartnerLogos(store)).resolves.toEqual([])
  })

  it('deletes the bucket object when alsoDeleteBucketObject is requested', async () => {
    const store = createStore([
      {
        id: 'logo-1',
        objectKey: 'marketing/logos/strategic/acme.png',
        alt: 'Acme',
        category: 'strategic',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
    ])
    const deleteBucketObject = vi.fn(async () => undefined)

    const outcome = await removePartnerLogo(
      store,
      { deleteBucketObject: { deleteObject: deleteBucketObject } },
      { id: 'logo-1', alsoDeleteBucketObject: true },
    )

    expect(outcome.bucketObjectDeleted).toBe(true)
    expect(deleteBucketObject).toHaveBeenCalledWith(
      'marketing/logos/strategic/acme.png',
    )
    expect(store.records).toHaveLength(0)
  })

  it('rejects remove when the partner logo assignment does not exist', async () => {
    const store = createStore()

    await expect(
      removePartnerLogo(store, {}, { id: 'missing-logo' }),
    ).rejects.toBeInstanceOf(PartnerLogoNotFoundError)
  })

  it('orders strategic logos before clinical logos', () => {
    expect(
      comparePartnerLogosForList(
        {
          category: 'clinical',
          sortOrder: 0,
        },
        {
          category: 'strategic',
          sortOrder: 99,
        },
      ),
    ).toBeGreaterThan(0)
  })

  it('updates objectKey, alt, and category on an existing logo', async () => {
    const store = createStore([
      {
        id: 'logo-1',
        objectKey: 'marketing/logos/strategic/a.png',
        alt: 'A',
        category: 'strategic',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
    ])

    const updated = await updatePartnerLogo(store, {
      id: 'logo-1',
      objectKey: 'marketing/logos/strategic/a-revised.png',
      alt: 'A revised',
      category: 'strategic',
    })

    expect(updated).toMatchObject({
      objectKey: 'marketing/logos/strategic/a-revised.png',
      alt: 'A revised',
      category: 'strategic',
      sortOrder: 0,
    })
  })

  it('appends a logo to the end when its category changes', async () => {
    const store = createStore([
      {
        id: 'logo-1',
        objectKey: 'marketing/logos/strategic/a.png',
        alt: 'A',
        category: 'strategic',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'logo-2',
        objectKey: 'marketing/logos/clinical/b.png',
        alt: 'B',
        category: 'clinical',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'logo-3',
        objectKey: 'marketing/logos/clinical/c.png',
        alt: 'C',
        category: 'clinical',
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
    ])

    const updated = await updatePartnerLogo(store, {
      id: 'logo-1',
      objectKey: 'marketing/logos/strategic/a.png',
      alt: 'A',
      category: 'clinical',
    })

    expect(updated).toMatchObject({
      category: 'clinical',
      sortOrder: 2,
    })
  })

  it('swaps sort order when reordering within a category', async () => {
    const store = createStore([
      {
        id: 'logo-1',
        objectKey: 'marketing/logos/strategic/a.png',
        alt: 'A',
        category: 'strategic',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'logo-2',
        objectKey: 'marketing/logos/strategic/b.png',
        alt: 'B',
        category: 'strategic',
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'logo-3',
        objectKey: 'marketing/logos/strategic/c.png',
        alt: 'C',
        category: 'strategic',
        sortOrder: 2,
        createdAt: now,
        updatedAt: now,
      },
    ])

    const reordered = await reorderPartnerLogo(store, {
      id: 'logo-2',
      direction: 'down',
    })

    expect(reordered.map((item) => item.id)).toEqual([
      'logo-1',
      'logo-3',
      'logo-2',
    ])
  })
})
