'use client'

import Link from 'next/link'
import { Badge } from '@virtality/ui/components/badge'
import { cn } from '@/lib/utils'
import type { HeadsetLibraryRow } from '@/lib/headset-library-rows'
import {
  immersivePickerMetaLine,
  isImmersivePickerRowSelectable,
} from '@/lib/immersive-video-picker'

export function ImmersiveVideoPickerRow({
  row,
  selected,
  disabled,
  onSelect,
}: {
  row: HeadsetLibraryRow
  selected: boolean
  disabled: boolean
  onSelect: (videoId: string) => void
}) {
  const selectable = isImmersivePickerRowSelectable(row.cell)
  const dimmed = !selectable

  return (
    <button
      type='button'
      disabled={disabled || dimmed}
      onClick={() => onSelect(row.videoId)}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left',
        selected && 'bg-accent',
        dimmed && 'opacity-50',
      )}
    >
      {row.thumbnailUrl ? (
        // Catalog thumbnails are CDN URLs outside the Next image host list.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.thumbnailUrl}
          alt=''
          className='size-12 rounded object-cover'
        />
      ) : (
        <div className='bg-muted size-12 rounded' />
      )}
      <div className='min-w-0 flex-1'>
        <div className='truncate text-sm font-medium'>{row.title}</div>
        <div className='text-muted-foreground truncate text-xs'>
          {immersivePickerMetaLine({
            activity: row.activity,
            durationSec: row.durationSec,
          })}
        </div>
        {dimmed ? (
          <div className='mt-1 flex flex-wrap items-center gap-2'>
            <Badge variant='outline'>Not on headset</Badge>
            <span className='text-muted-foreground text-xs'>
              Download this video to the headset from{' '}
              <Link href='/vr-video' className='underline'>
                VR Experiences
              </Link>
              .
            </span>
          </div>
        ) : null}
      </div>
    </button>
  )
}
