import { describe, expect, it, vi } from 'vitest'
import { MOSAIC_EMPTY_SAVE_WARNING } from '../../types/mosaic.ts'
import {
  assessMosaicLiveEligibility,
  getMosaicBoard,
  MosaicValidationError,
  saveMosaicBoard,
  validateMosaicTilePlacement,
  type MosaicStore,
  type MosaicTileRecord,
} from './mosaic.ts'

function createStore(
  initialRecords: MosaicTileRecord[] = [],
): MosaicStore & { records: MosaicTileRecord[] } {
  const records = [...initialRecords]

  return {
    records,
    listTiles: vi.fn(async () => [...records]),
    replaceAllTiles: vi.fn(async (tiles: MosaicTileRecord[]) => {
      records.splice(0, records.length, ...tiles)
      return [...records]
    }),
  }
}

function tile(
  overrides: Partial<MosaicTileRecord> & Pick<MosaicTileRecord, 'row' | 'col'>,
): MosaicTileRecord {
  return {
    id: 'tile-1',
    objectKey: 'marketing/mosaic/a.jpg',
    mediaKind: 'image',
    alt: 'Clinic scene',
    width: 1,
    height: 1,
    ...overrides,
  }
}

describe('mosaic domain', () => {
  it('treats an empty board as live-eligible hide state', () => {
    expect(assessMosaicLiveEligibility([])).toEqual({ status: 'empty' })
  })

  it('accepts only allowed spans and in-bounds positions', () => {
    expect(
      validateMosaicTilePlacement({ row: 0, col: 0, width: 1, height: 1 }),
    ).toEqual([])
    expect(
      validateMosaicTilePlacement({ row: 0, col: 0, width: 2, height: 2 }),
    ).toEqual([])

    expect(
      validateMosaicTilePlacement({ row: 0, col: 0, width: 3, height: 1 }),
    ).toContain('Tile span 3×1 is not allowed; use 1×1, 2×1, 1×2, or 2×2.')
    expect(
      validateMosaicTilePlacement({ row: 0, col: 2, width: 2, height: 1 }),
    ).toContain(
      'Tile at row 0, col 2 with span 2×1 extends outside the 3×3 board.',
    )
  })

  it('marks a perfect 3×3 tiling as live-eligible', () => {
    const tiles = [
      { row: 0, col: 0, width: 2, height: 2 },
      { row: 0, col: 2, width: 1, height: 2 },
      { row: 2, col: 0, width: 2, height: 1 },
      { row: 2, col: 2, width: 1, height: 1 },
    ]

    expect(assessMosaicLiveEligibility(tiles)).toEqual({ status: 'live' })
  })

  it('explains gaps and overlaps on incomplete non-empty boards', () => {
    const gapped = assessMosaicLiveEligibility([
      { row: 0, col: 0, width: 1, height: 1 },
      { row: 0, col: 1, width: 1, height: 1 },
    ])

    expect(gapped).toMatchObject({ status: 'incomplete' })
    expect(gapped.status === 'incomplete' && gapped.errors.join(' ')).toMatch(
      /not covered/i,
    )

    const overlapping = assessMosaicLiveEligibility([
      { row: 0, col: 0, width: 2, height: 2 },
      { row: 1, col: 1, width: 2, height: 2 },
    ])

    expect(overlapping).toMatchObject({ status: 'incomplete' })
    expect(
      overlapping.status === 'incomplete' && overlapping.errors.join(' '),
    ).toMatch(/overlap/i)
  })

  it('reads the saved board with eligibility and CDN URLs from the store', async () => {
    const store = createStore(
      Array.from({ length: 9 }, (_, index) =>
        tile({
          id: `tile-${index + 1}`,
          row: Math.floor(index / 3),
          col: index % 3,
          objectKey: `marketing/mosaic/tile-${index + 1}.jpg`,
          alt: `Tile ${index + 1}`,
        }),
      ),
    )

    const board = await getMosaicBoard(store)

    expect(board.eligibility).toEqual({ status: 'live' })
    expect(board.tiles).toHaveLength(9)
    expect(board.tiles[0]?.cdnUrl).toMatch(/marketing\/mosaic\/tile-1\.jpg$/)
  })

  it('saves an empty board for hide and rejects incomplete boards', async () => {
    const store = createStore([
      tile({
        id: 'tile-1',
        row: 0,
        col: 0,
        objectKey: 'marketing/mosaic/stale.jpg',
      }),
    ])

    await expect(
      saveMosaicBoard(
        store,
        { generateId: () => 'new' },
        {
          tiles: [],
        },
      ),
    ).rejects.toBeInstanceOf(MosaicValidationError)

    const hidden = await saveMosaicBoard(
      store,
      { generateId: () => 'new' },
      {
        tiles: [],
        acknowledgeEmptyHide: true,
      },
    )

    expect(hidden.eligibility).toEqual({ status: 'empty' })
    expect(hidden.warnings).toEqual([MOSAIC_EMPTY_SAVE_WARNING])
    expect(store.records).toHaveLength(0)
    expect(store.replaceAllTiles).toHaveBeenCalledWith([])
    expect(store.replaceAllTiles).toHaveBeenCalledTimes(1)

    await expect(
      saveMosaicBoard(
        store,
        { generateId: () => 'new' },
        {
          tiles: [
            {
              objectKey: 'marketing/mosaic/gap.jpg',
              mediaKind: 'image',
              alt: 'Gap',
              row: 0,
              col: 0,
              width: 1,
              height: 1,
            },
          ],
        },
      ),
    ).rejects.toBeInstanceOf(MosaicValidationError)
  })

  it('rejects tiles with invalid object keys or empty alt text', async () => {
    const store = createStore()

    await expect(
      saveMosaicBoard(
        store,
        { generateId: () => 'new' },
        {
          tiles: [
            {
              objectKey: '  ',
              mediaKind: 'image',
              alt: 'Missing key',
              row: 0,
              col: 0,
              width: 1,
              height: 1,
            },
          ],
        },
      ),
    ).rejects.toMatchObject({
      errors: [expect.stringMatching(/object key/i)],
    })

    await expect(
      saveMosaicBoard(
        store,
        { generateId: () => 'new' },
        {
          tiles: [
            {
              objectKey: 'marketing/mosaic/no-alt.jpg',
              mediaKind: 'image',
              alt: '   ',
              row: 0,
              col: 0,
              width: 1,
              height: 1,
            },
          ],
        },
      ),
    ).rejects.toMatchObject({
      errors: ['Alt text cannot be empty.'],
    })
  })

  it('saves a perfect tiling through the store seam', async () => {
    const store = createStore()

    const saved = await saveMosaicBoard(
      store,
      { generateId: () => 'new' },
      {
        tiles: Array.from({ length: 9 }, (_, index) => ({
          objectKey: `marketing/mosaic/tile-${index + 1}.jpg`,
          mediaKind: 'image' as const,
          alt: `Tile ${index + 1}`,
          row: Math.floor(index / 3),
          col: index % 3,
          width: 1,
          height: 1,
        })),
      },
    )

    expect(saved.eligibility).toEqual({ status: 'live' })
    expect(store.records).toHaveLength(9)
  })
})
