import {
  MOSAIC_GRID_SIZE,
  type MosaicMediaKind,
  type MosaicTileInput,
  type MosaicTilePlacement,
} from '@virtality/shared/types'
import {
  ALLOWED_MOSAIC_SPANS,
  getMosaicTileCells,
  validateMosaicTilePlacement,
} from '@virtality/shared/utils'

export const MOSAIC_TRAY_DRAG_MIME =
  'application/x-virtality-mosaic-tray-item-id'

export const MOSAIC_BOARD_TILE_DRAG_MIME =
  'application/x-virtality-mosaic-board-tile-id'

export type MosaicTrayItem = {
  id: string
  objectKey: string
  mediaKind: MosaicMediaKind
  alt: string
}

export type MosaicEditorTile = MosaicTilePlacement & {
  id: string
  objectKey: string
  mediaKind: MosaicMediaKind
  alt: string
}

export type MosaicEditorState = {
  tray: MosaicTrayItem[]
  tiles: MosaicEditorTile[]
}

export type MosaicGridCell = {
  row: number
  col: number
}

export type PlaceMosaicTileResult =
  | { ok: true; state: MosaicEditorState }
  | {
      ok: false
      reason: 'occupied' | 'out_of_bounds' | 'tray_item_missing' | 'invalid_alt'
    }

export type ResizeMosaicTileResult =
  | { ok: true; state: MosaicEditorState }
  | { ok: false; reason: 'tile_missing' | 'illegal_span' }

export type MosaicSpan = {
  width: MosaicTilePlacement['width']
  height: MosaicTilePlacement['height']
}

export function formatMosaicSpan({ width, height }: MosaicSpan): string {
  return `${width}×${height}`
}

export function mosaicSpansEqual(a: MosaicSpan, b: MosaicSpan): boolean {
  return a.width === b.width && a.height === b.height
}

function cellIsInTile(
  cell: { row: number; col: number },
  tile: MosaicTilePlacement,
): boolean {
  return (
    cell.row >= tile.row &&
    cell.row < tile.row + tile.height &&
    cell.col >= tile.col &&
    cell.col < tile.col + tile.width
  )
}

export function createEmptyMosaicEditorState(): MosaicEditorState {
  return { tray: [], tiles: [] }
}

export function clearMosaicEditorState(): MosaicEditorState {
  return createEmptyMosaicEditorState()
}

export function addMosaicTrayItem(
  state: MosaicEditorState,
  item: MosaicTrayItem,
): MosaicEditorState {
  return {
    ...state,
    tray: [...state.tray, item],
  }
}

export function removeMosaicTrayItem(
  state: MosaicEditorState,
  trayItemId: string,
): MosaicEditorState {
  return {
    ...state,
    tray: state.tray.filter((item) => item.id !== trayItemId),
  }
}

export function isMosaicCellOccupied(
  tiles: readonly MosaicTilePlacement[],
  row: number,
  col: number,
): boolean {
  return tiles.some((tile) => cellIsInTile({ row, col }, tile))
}

export function getEmptyMosaicCells(
  tiles: readonly MosaicTilePlacement[],
): MosaicGridCell[] {
  const cells: MosaicGridCell[] = []

  for (let row = 0; row < MOSAIC_GRID_SIZE; row += 1) {
    for (let col = 0; col < MOSAIC_GRID_SIZE; col += 1) {
      if (!isMosaicCellOccupied(tiles, row, col)) {
        cells.push({ row, col })
      }
    }
  }

  return cells
}

export function canPlaceMosaicTileAt(
  tiles: readonly MosaicTilePlacement[],
  placement: MosaicTilePlacement,
): boolean {
  if (validateMosaicTilePlacement(placement).length > 0) {
    return false
  }

  return getMosaicTileCells(placement).every(
    (cell) => !isMosaicCellOccupied(tiles, cell.row, cell.col),
  )
}

function tilesExcept(
  tiles: readonly MosaicEditorTile[],
  tileId: string,
): MosaicEditorTile[] {
  return tiles.filter((tile) => tile.id !== tileId)
}

export function canPlaceMosaicSpanAt(
  tiles: readonly MosaicEditorTile[],
  tileId: string,
  placement: MosaicTilePlacement,
): boolean {
  return canPlaceMosaicTileAt(tilesExcept(tiles, tileId), placement)
}

export function getLegalMosaicSpansForTile(
  tiles: readonly MosaicEditorTile[],
  tileId: string,
): MosaicSpan[] {
  const tile = tiles.find((entry) => entry.id === tileId)

  if (!tile) {
    return []
  }

  return ALLOWED_MOSAIC_SPANS.filter((span) =>
    canPlaceMosaicSpanAt(tiles, tileId, {
      row: tile.row,
      col: tile.col,
      width: span.width,
      height: span.height,
    }),
  )
}

export function resizeMosaicTile(
  state: MosaicEditorState,
  tileId: string,
  span: MosaicSpan,
): ResizeMosaicTileResult {
  const tile = state.tiles.find((entry) => entry.id === tileId)

  if (!tile) {
    return { ok: false, reason: 'tile_missing' }
  }

  const { width, height } = span
  const placement: MosaicTilePlacement = {
    row: tile.row,
    col: tile.col,
    width,
    height,
  }

  if (!canPlaceMosaicSpanAt(state.tiles, tileId, placement)) {
    return { ok: false, reason: 'illegal_span' }
  }

  return {
    ok: true,
    state: {
      ...state,
      tiles: state.tiles.map((entry) =>
        entry.id === tileId ? { ...entry, width, height } : entry,
      ),
    },
  }
}

export function removeMosaicTileFromBoard(
  state: MosaicEditorState,
  tileId: string,
  trayItemId: string,
): MosaicEditorState | null {
  const tile = state.tiles.find((entry) => entry.id === tileId)

  if (!tile) {
    return null
  }

  return {
    tray: [
      ...state.tray,
      {
        id: trayItemId,
        objectKey: tile.objectKey,
        mediaKind: tile.mediaKind,
        alt: tile.alt,
      },
    ],
    tiles: state.tiles.filter((entry) => entry.id !== tileId),
  }
}

export function mosaicEditorTilesToSaveInput(
  tiles: readonly MosaicEditorTile[],
): MosaicTileInput[] {
  return tiles.map(
    ({ objectKey, mediaKind, alt, row, col, width, height }) => ({
      objectKey,
      mediaKind,
      alt,
      row,
      col,
      width,
      height,
    }),
  )
}

export function placeMosaicTileFromTray(
  state: MosaicEditorState,
  trayItemId: string,
  row: number,
  col: number,
  tileId: string,
): PlaceMosaicTileResult {
  const trayItem = state.tray.find((item) => item.id === trayItemId)

  if (!trayItem) {
    return { ok: false, reason: 'tray_item_missing' }
  }

  const trimmedAlt = trayItem.alt.trim()
  if (!trimmedAlt) {
    return { ok: false, reason: 'invalid_alt' }
  }

  const placement: MosaicTilePlacement = {
    row,
    col,
    width: 1,
    height: 1,
  }

  if (validateMosaicTilePlacement(placement).length > 0) {
    return { ok: false, reason: 'out_of_bounds' }
  }

  if (!canPlaceMosaicTileAt(state.tiles, placement)) {
    return { ok: false, reason: 'occupied' }
  }

  const tile: MosaicEditorTile = {
    id: tileId,
    objectKey: trayItem.objectKey,
    mediaKind: trayItem.mediaKind,
    alt: trimmedAlt,
    row,
    col,
    width: 1,
    height: 1,
  }

  return {
    ok: true,
    state: {
      ...removeMosaicTrayItem(state, trayItemId),
      tiles: [...state.tiles, tile],
    },
  }
}
