'use client'

import { BucketVideoPreview } from '@/components/bucket/bucket-video-preview'
import { Skeleton } from '@/components/ui/skeleton'
import { getMosaicTileGridStyle } from '@/lib/mosaic-grid'
import type {
  MosaicBoardView,
  MosaicLiveEligibility,
  MosaicTileListItem,
} from '@virtality/shared/types'
import { Badge } from '@virtality/ui/components/badge'
import Image from 'next/image'

type MosaicBoardPreviewProps = {
  board: MosaicBoardView | undefined
  isLoading?: boolean
}

type MosaicEligibilityBadgeProps = {
  eligibility: MosaicLiveEligibility | undefined
}

function MosaicEligibilityBadge({ eligibility }: MosaicEligibilityBadgeProps) {
  if (!eligibility) {
    return null
  }

  switch (eligibility.status) {
    case 'live':
      return <Badge variant='default'>Live on website</Badge>
    case 'empty':
      return <Badge variant='secondary'>Hidden (empty board)</Badge>
    case 'incomplete':
      return <Badge variant='outline'>Incomplete (hidden on website)</Badge>
  }
}

function MosaicTilePreview({ tile }: { tile: MosaicTileListItem }) {
  const media =
    tile.mediaKind === 'image' ? (
      <Image
        src={tile.cdnUrl}
        alt={tile.alt}
        fill
        className='object-cover'
        sizes='(min-width: 768px) 200px, 120px'
      />
    ) : (
      <BucketVideoPreview src={tile.cdnUrl} label={tile.alt} fill playOnHover />
    )

  return (
    <div
      className='relative overflow-hidden rounded-md border bg-zinc-100 dark:bg-zinc-900'
      style={getMosaicTileGridStyle(tile)}
    >
      {media}
    </div>
  )
}

const MosaicBoardPreview = ({ board, isLoading }: MosaicBoardPreviewProps) => {
  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='aspect-square w-full max-w-xl' />
      </div>
    )
  }

  const tiles = board?.tiles ?? []
  const eligibility = board?.eligibility

  if (tiles.length === 0) {
    return (
      <div className='space-y-4'>
        <MosaicEligibilityBadge eligibility={eligibility} />
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground text-sm'>
            No tiles saved yet. The landing mosaic section stays hidden until a
            complete board is published.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <MosaicEligibilityBadge eligibility={eligibility} />
        <p className='text-muted-foreground text-sm'>
          Read-only preview of the saved landing mosaic.
        </p>
      </div>

      <div
        className='grid aspect-square w-full max-w-xl grid-cols-3 grid-rows-3 gap-2'
        aria-label='Saved landing mosaic preview'
        aria-readonly='true'
      >
        {tiles.map((tile) => (
          <MosaicTilePreview key={tile.id} tile={tile} />
        ))}
      </div>

      {eligibility?.status === 'incomplete' && (
        <p className='text-muted-foreground max-w-xl text-sm'>
          This board is not live yet. Visitors only see a perfect 3×3 tiling.
        </p>
      )}
    </div>
  )
}

export default MosaicBoardPreview
