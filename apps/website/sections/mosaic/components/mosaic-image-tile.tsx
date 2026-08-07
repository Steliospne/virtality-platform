'use client'

import Image from 'next/image'
import type { MosaicTileListItem } from '@virtality/shared/types'
import { shouldBypassVercelImageOptimization } from '@virtality/shared/utils'
import {
  MOSAIC_TILE_FRAME_CLASS,
  MOSAIC_TILE_OPEN_HOVER_CLASS,
  getMosaicTileGridStyle,
} from '../lib/mosaic-grid'
import { getMosaicImageTileProps } from '../lib/mosaic-tile'
import { cn } from '@/lib/utils'

type MosaicImageTileProps = {
  tile: MosaicTileListItem
  onOpen: () => void
}

const MosaicImageTile = ({ tile, onOpen }: MosaicImageTileProps) => {
  const tileImage = getMosaicImageTileProps(tile)

  if (!tileImage) {
    return null
  }

  const { src, alt } = tileImage

  return (
    <button
      type='button'
      onClick={onOpen}
      aria-label={alt}
      className={cn(
        MOSAIC_TILE_FRAME_CLASS,
        MOSAIC_TILE_OPEN_HOVER_CLASS,
        'block p-0 text-left',
      )}
      style={getMosaicTileGridStyle(tile)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized={shouldBypassVercelImageOptimization(src)}
        sizes='(max-width: 640px) 30vw, 240px'
        className='object-cover'
      />
    </button>
  )
}

export default MosaicImageTile
