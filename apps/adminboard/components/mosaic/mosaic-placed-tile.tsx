'use client'

import { getMosaicTileGridStyle } from '@/lib/mosaic-grid'
import {
  formatMosaicSpan,
  MOSAIC_BOARD_TILE_DRAG_MIME,
  type MosaicEditorTile,
} from '@/lib/mosaic-editor'
import { BucketVideoPreview } from '@/components/bucket/bucket-video-preview'
import { cn } from '@/lib/utils'
import {
  bucketCdnUrl,
  shouldBypassVercelImageOptimization,
} from '@virtality/shared/utils'
import Image from 'next/image'

type MosaicPlacedTileProps = {
  tile: MosaicEditorTile
  isSelected: boolean
  onSelect: () => void
}

export function MosaicPlacedTile({
  tile,
  isSelected,
  onSelect,
}: MosaicPlacedTileProps) {
  const src = bucketCdnUrl(tile.objectKey)

  return (
    <button
      type='button'
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(MOSAIC_BOARD_TILE_DRAG_MIME, tile.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      className={cn(
        'relative overflow-hidden rounded-md border bg-zinc-100 text-left dark:bg-zinc-900',
        isSelected
          ? 'ring-primary ring-2 ring-offset-2'
          : 'hover:ring-primary/40 hover:ring-2',
      )}
      style={getMosaicTileGridStyle(tile)}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      aria-pressed={isSelected}
      aria-label={`${tile.alt}, span ${formatMosaicSpan(tile)}. Drag back to the tray to remove.`}
    >
      {tile.mediaKind === 'image' ? (
        <Image
          src={src}
          alt={tile.alt}
          fill
          unoptimized={shouldBypassVercelImageOptimization(src)}
          className='object-cover'
          sizes='(min-width: 768px) 200px, 120px'
        />
      ) : (
        <BucketVideoPreview src={src} label={tile.alt} fill playOnHover />
      )}
    </button>
  )
}
