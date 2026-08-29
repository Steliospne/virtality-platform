import {
  MOSAIC_GRID_SIZE,
  MOSAIC_EMPTY_SAVE_WARNING,
  type MosaicBoardView,
  type MosaicLiveEligibility,
  type MosaicMediaKind,
  type MosaicTileInput,
  type MosaicTileListItem,
  type MosaicTilePlacement,
  type SaveMosaicInput,
  type SaveMosaicResult,
} from '../../types/mosaic.ts'
import { bucketCdnUrl, validateBucketObjectKey } from './bucket.ts'

export { MOSAIC_EMPTY_SAVE_WARNING } from '../../types/mosaic.ts'

export const ALLOWED_MOSAIC_SPANS = [
  { width: 1, height: 1 },
  { width: 2, height: 1 },
  { width: 1, height: 2 },
  { width: 2, height: 2 },
] as const

export type MosaicTileRecord = {
  id: string
  objectKey: string
  mediaKind: MosaicMediaKind
  alt: string
  row: number
  col: number
  width: MosaicTilePlacement['width']
  height: MosaicTilePlacement['height']
}

export type MosaicStore = {
  listTiles: () => Promise<MosaicTileRecord[]>
  replaceAllTiles: (tiles: MosaicTileRecord[]) => Promise<MosaicTileRecord[]>
}

export class MosaicValidationError extends Error {
  readonly errors: string[]

  constructor(errors: string[]) {
    super(errors.join(' '))
    this.name = 'MosaicValidationError'
    this.errors = errors
  }
}

function formatSpan(width: number, height: number): string {
  return `${width}×${height}`
}

function isAllowedSpan(width: number, height: number): boolean {
  return ALLOWED_MOSAIC_SPANS.some(
    (span) => span.width === width && span.height === height,
  )
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

function tilePlacementKey(tile: MosaicTilePlacement): string {
  return `row ${tile.row}, col ${tile.col}, span ${formatSpan(tile.width, tile.height)}`
}

export function getMosaicTileCells(
  tile: MosaicTilePlacement,
): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = []

  for (let row = tile.row; row < tile.row + tile.height; row += 1) {
    for (let col = tile.col; col < tile.col + tile.width; col += 1) {
      cells.push({ row, col })
    }
  }

  return cells
}

function isInBounds(row: number, col: number): boolean {
  return (
    row >= 0 && col >= 0 && row < MOSAIC_GRID_SIZE && col < MOSAIC_GRID_SIZE
  )
}

export function validateMosaicTilePlacement(
  tile: MosaicTilePlacement,
): string[] {
  const errors: string[] = []

  if (!Number.isInteger(tile.row) || !Number.isInteger(tile.col)) {
    errors.push('Tile position must use whole-number row and col values.')
  }

  if (!Number.isInteger(tile.width) || !Number.isInteger(tile.height)) {
    errors.push('Tile span must use whole-number width and height values.')
  }

  if (!isAllowedSpan(tile.width, tile.height)) {
    errors.push(
      `Tile span ${formatSpan(tile.width, tile.height)} is not allowed; use 1×1, 2×1, 1×2, or 2×2.`,
    )
  }

  if (tile.row < 0 || tile.col < 0) {
    errors.push('Tile position cannot be negative.')
  }

  if (tile.row >= MOSAIC_GRID_SIZE || tile.col >= MOSAIC_GRID_SIZE) {
    errors.push(
      `Tile origin at row ${tile.row}, col ${tile.col} is outside the ${MOSAIC_GRID_SIZE}×${MOSAIC_GRID_SIZE} board.`,
    )
  }

  const extendsOutsideGrid = getMosaicTileCells(tile).some(
    (cell) => !isInBounds(cell.row, cell.col),
  )

  if (extendsOutsideGrid) {
    errors.push(
      `Tile at row ${tile.row}, col ${tile.col} with span ${formatSpan(tile.width, tile.height)} extends outside the ${MOSAIC_GRID_SIZE}×${MOSAIC_GRID_SIZE} board.`,
    )
  }

  return errors
}

function collectBoardCoverageErrors(tiles: MosaicTilePlacement[]): string[] {
  const occupancy = new Map<string, number>()

  for (const tile of tiles) {
    for (const cell of getMosaicTileCells(tile)) {
      const key = cellKey(cell.row, cell.col)
      occupancy.set(key, (occupancy.get(key) ?? 0) + 1)
    }
  }

  const errors: string[] = []

  for (const [key, count] of occupancy.entries()) {
    if (count > 1) {
      const [row, col] = key.split(',').map(Number)
      errors.push(`Tiles overlap at row ${row}, col ${col}.`)
    }
  }

  for (let row = 0; row < MOSAIC_GRID_SIZE; row += 1) {
    for (let col = 0; col < MOSAIC_GRID_SIZE; col += 1) {
      if (!occupancy.has(cellKey(row, col))) {
        errors.push(`Cell at row ${row}, col ${col} is not covered.`)
      }
    }
  }

  return errors
}

export function assessMosaicLiveEligibility(
  tiles: MosaicTilePlacement[],
): MosaicLiveEligibility {
  if (tiles.length === 0) {
    return { status: 'empty' }
  }

  const errors: string[] = []
  const validPlacements: MosaicTilePlacement[] = []

  for (const tile of tiles) {
    const tileErrors = validateMosaicTilePlacement(tile)

    if (tileErrors.length === 0) {
      validPlacements.push(tile)
    }

    for (const error of tileErrors) {
      errors.push(`Tile at ${tilePlacementKey(tile)}: ${error}`)
    }
  }

  if (validPlacements.length > 0) {
    errors.push(...collectBoardCoverageErrors(validPlacements))
  }

  if (errors.length === 0) {
    return { status: 'live' }
  }

  return {
    status: 'incomplete',
    errors,
  }
}

function normalizeMosaicTileInput(tile: MosaicTileInput): MosaicTileInput {
  const objectKey = tile.objectKey.trim()
  const alt = tile.alt.trim()
  const objectKeyError = validateBucketObjectKey(objectKey)

  if (objectKeyError) {
    throw new MosaicValidationError([objectKeyError])
  }

  if (!alt) {
    throw new MosaicValidationError(['Alt text cannot be empty.'])
  }

  return {
    ...tile,
    objectKey,
    alt,
  }
}

function validateEmptySaveAcknowledgment(
  isEmpty: boolean,
  acknowledgeEmptyHide: boolean,
): string[] {
  if (isEmpty && !acknowledgeEmptyHide) {
    return [
      'Empty mosaic saves require acknowledgeEmptyHide: true to hide the live section.',
    ]
  }

  return []
}

function validateMosaicTilesForSave(tiles: MosaicTileInput[]): string[] {
  const eligibility = assessMosaicLiveEligibility(tiles)

  if (eligibility.status === 'empty' || eligibility.status === 'live') {
    return []
  }

  return eligibility.errors
}

function toMosaicTileRecord(
  tile: MosaicTileInput,
  id: string,
): MosaicTileRecord {
  return {
    id,
    objectKey: tile.objectKey,
    mediaKind: tile.mediaKind,
    alt: tile.alt,
    row: tile.row,
    col: tile.col,
    width: tile.width,
    height: tile.height,
  }
}

function buildMosaicBoardView(records: MosaicTileRecord[]): MosaicBoardView {
  return {
    tiles: records.map(mapMosaicTileToListItem),
    eligibility: assessMosaicLiveEligibility(records),
  }
}

export function mapMosaicTileToListItem(
  record: MosaicTileRecord,
): MosaicTileListItem {
  return {
    id: record.id,
    objectKey: record.objectKey,
    mediaKind: record.mediaKind,
    alt: record.alt,
    row: record.row,
    col: record.col,
    width: record.width,
    height: record.height,
    cdnUrl: bucketCdnUrl(record.objectKey),
  }
}

export async function getMosaicBoard(
  store: MosaicStore,
): Promise<MosaicBoardView> {
  const records = await store.listTiles()

  return buildMosaicBoardView(records)
}

export async function saveMosaicBoard(
  store: MosaicStore,
  deps: { generateId: () => string },
  input: SaveMosaicInput,
): Promise<SaveMosaicResult> {
  const normalizedTiles = input.tiles.map(normalizeMosaicTileInput)
  const errors = [
    ...validateEmptySaveAcknowledgment(
      normalizedTiles.length === 0,
      input.acknowledgeEmptyHide,
    ),
    ...validateMosaicTilesForSave(normalizedTiles),
  ]

  if (errors.length > 0) {
    throw new MosaicValidationError(errors)
  }

  const records = await store.replaceAllTiles(
    normalizedTiles.map((tile) => toMosaicTileRecord(tile, deps.generateId())),
  )

  const board = buildMosaicBoardView(records)

  if (normalizedTiles.length === 0) {
    return {
      ...board,
      warnings: [MOSAIC_EMPTY_SAVE_WARNING],
    }
  }

  return board
}
