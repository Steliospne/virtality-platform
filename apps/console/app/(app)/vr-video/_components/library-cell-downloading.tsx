'use client'

import { Button } from '@virtality/ui/components/button'
import { stalledSuffix } from '@/lib/headset-library-format'
import { HEADSET_VIDEO_SUPPORT } from '@/lib/immersive-video-headset-support'
import { LibraryCellCancelButton } from './library-cell-cancel-button'

export function LibraryCellDownloading({
  percent,
  stalled,
  disabled,
  onPause,
  onCancel,
}: {
  percent: number
  stalled: boolean
  disabled: boolean
  onPause: () => void
  onCancel: () => void
}) {
  return (
    <div className='flex items-center gap-2'>
      <div className='bg-muted h-1.5 w-24 overflow-hidden rounded-full'>
        <div className='bg-primary h-full' style={{ width: `${percent}%` }} />
      </div>
      <span className='text-muted-foreground text-xs whitespace-nowrap'>
        {percent} %{stalledSuffix(stalled)}
      </span>
      <LibraryCellCancelButton disabled={disabled} onCancel={onCancel} />
      {HEADSET_VIDEO_SUPPORT.downloadPause ? (
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled}
          onClick={onPause}
        >
          Pause
        </Button>
      ) : null}
    </div>
  )
}
