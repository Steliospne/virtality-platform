import { describe, expect, it } from 'vitest'
import {
  getMosaicTileGridStyle,
  MOSAIC_GRID_CLASS,
  MOSAIC_GRID_MOBILE_SCALE_CLASS,
  MOSAIC_GRID_SQUARE_SHELL_CLASS,
  MOSAIC_GRID_SQUARE_SPACER_CLASS,
  MOSAIC_TILE_FRAME_CLASS,
} from './mosaic-grid'

describe('mosaic grid placement', () => {
  it('maps saved row, col, and span onto a CSS 3×3 grid', () => {
    expect(
      getMosaicTileGridStyle({ row: 0, col: 0, width: 2, height: 2 }),
    ).toEqual({
      gridColumn: '1 / span 2',
      gridRow: '1 / span 2',
    })

    expect(
      getMosaicTileGridStyle({ row: 2, col: 2, width: 1, height: 1 }),
    ).toEqual({
      gridColumn: '3 / span 1',
      gridRow: '3 / span 1',
    })
  })

  it('keeps a width-based mobile shrink without transform scale', () => {
    expect(MOSAIC_GRID_MOBILE_SCALE_CLASS).toMatch(/w-\[82%\]/)
    expect(MOSAIC_GRID_MOBILE_SCALE_CLASS).toMatch(/sm:w-full/)
    expect(MOSAIC_GRID_MOBILE_SCALE_CLASS).not.toMatch(/scale-/)
  })

  it('uses a padding-bottom square shell so older Safari keeps 1:1 cells', () => {
    expect(MOSAIC_GRID_SQUARE_SHELL_CLASS).toMatch(/relative/)
    expect(MOSAIC_GRID_SQUARE_SPACER_CLASS).toMatch(/pb-\[100%\]/)
    expect(MOSAIC_GRID_CLASS).toMatch(/absolute inset-0/)
    expect(MOSAIC_TILE_FRAME_CLASS).toMatch(/min-h-0/)
    expect(MOSAIC_TILE_FRAME_CLASS).toMatch(/min-w-0/)
    expect(MOSAIC_TILE_FRAME_CLASS).toMatch(/size-full/)
  })
})
