'use client'

import { BucketVideoPreview } from '@/components/bucket/bucket-video-preview'
import {
  MOSAIC_BOARD_TILE_DRAG_MIME,
  MOSAIC_TRAY_DRAG_MIME,
  type MosaicTrayItem,
} from '@/lib/mosaic-editor'
import { cn } from '@/lib/utils'
import { bucketCdnUrl } from '@virtality/shared/utils'
import Image from 'next/image'
import { useState } from 'react'

type MosaicTrayProps = {
  items: MosaicTrayItem[]
  onReturnTile?: (tileId: string) => void
}

const MosaicTray = ({ items, onReturnTile }: MosaicTrayProps) => {
  const [isTileDropActive, setIsTileDropActive] = useState(false)

  const canAcceptBoardTile = (types: readonly string[]) =>
    Boolean(onReturnTile) && types.includes(MOSAIC_BOARD_TILE_DRAG_MIME)

  return (
    <section
      aria-label='Staging tray'
      className={cn(
        'space-y-3 rounded-lg transition-colors',
        isTileDropActive && 'bg-primary/5 ring-primary ring-2 ring-offset-2',
      )}
      onDragEnter={(event) => {
        if (!canAcceptBoardTile([...event.dataTransfer.types])) {
          return
        }

        event.preventDefault()
        setIsTileDropActive(true)
      }}
      onDragOver={(event) => {
        if (!canAcceptBoardTile([...event.dataTransfer.types])) {
          return
        }

        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setIsTileDropActive(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) {
          return
        }

        setIsTileDropActive(false)
      }}
      onDrop={(event) => {
        if (!onReturnTile) {
          return
        }

        const tileId = event.dataTransfer.getData(MOSAIC_BOARD_TILE_DRAG_MIME)
        if (!tileId) {
          return
        }

        event.preventDefault()
        setIsTileDropActive(false)
        onReturnTile(tileId)
      }}
    >
      <div>
        <h2 className='text-sm font-medium'>Staging tray</h2>
        <p className='text-muted-foreground text-sm'>
          Drag media onto empty board cells to place them. Drag board tiles back
          here to remove them.
        </p>
      </div>

      {items.length === 0 ? (
        <div className='rounded-lg border border-dashed p-6 text-center'>
          <p className='text-muted-foreground text-sm'>
            {isTileDropActive
              ? 'Drop to return the tile to the tray.'
              : 'No staged media yet. Add bucket objects to the tray before placing them on the board.'}
          </p>
        </div>
      ) : (
        <ul className='flex flex-wrap gap-3'>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type='button'
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(MOSAIC_TRAY_DRAG_MIME, item.id)
                  event.dataTransfer.effectAllowed = 'copy'
                }}
                className='hover:bg-accent flex w-36 flex-col gap-2 rounded-lg border p-2 text-left'
                aria-label={`Drag ${item.alt} onto the board`}
              >
                <div className='relative aspect-square overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900'>
                  {item.mediaKind === 'image' ? (
                    <Image
                      src={bucketCdnUrl(item.objectKey)}
                      alt=''
                      fill
                      className='object-cover'
                      sizes='144px'
                    />
                  ) : (
                    <BucketVideoPreview
                      src={bucketCdnUrl(item.objectKey)}
                      label={item.alt}
                      fill
                      playOnHover
                    />
                  )}
                </div>
                <span className='line-clamp-2 text-xs font-medium'>
                  {item.alt}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MosaicTray
