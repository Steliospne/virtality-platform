import type { MosaicTileListItem } from '@virtality/shared/types'

/** Prefer width over transform:scale so older Safari keeps a real square layout box. */
export const MOSAIC_GRID_MOBILE_SCALE_CLASS =
  'mx-auto w-[82%] max-w-3xl sm:w-full'

/** Padding-bottom square shell: works when `aspect-ratio` is missing (older iOS). */
export const MOSAIC_GRID_SQUARE_SHELL_CLASS = 'relative w-full'

export const MOSAIC_GRID_SQUARE_SPACER_CLASS =
  'pointer-events-none block w-full pb-[100%]'

export const MOSAIC_GRID_CLASS =
  'absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2 md:gap-3'

export const MOSAIC_TILE_FRAME_CLASS =
  'relative min-h-0 min-w-0 size-full overflow-hidden rounded-lg border border-vital-blue-100/80 bg-vital-blue-50/40'

export const MOSAIC_TILE_OPEN_HOVER_CLASS =
  'cursor-pointer transition-opacity hover:opacity-95'

export const MOSAIC_LIGHTBOX_MAX_HEIGHT_CLASS = 'max-h-[85vh]'

export function getMosaicTileGridStyle(
  tile: Pick<MosaicTileListItem, 'row' | 'col' | 'width' | 'height'>,
) {
  return {
    gridColumn: `${tile.col + 1} / span ${tile.width}`,
    gridRow: `${tile.row + 1} / span ${tile.height}`,
  }
}
