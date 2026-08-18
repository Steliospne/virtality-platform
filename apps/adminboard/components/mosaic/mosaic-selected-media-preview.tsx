'use client'

import type { MosaicMediaSelection } from '@/components/mosaic/mosaic-media-picker-dialog'
import {
  bucketCdnUrl,
  shouldBypassVercelImageOptimization,
} from '@virtality/shared/utils'
import { BucketVideoPreview } from '@/components/bucket/bucket-video-preview'
import Image from 'next/image'

export function SelectedMediaPreview({
  selection,
  alt,
}: {
  selection: MosaicMediaSelection
  alt: string
}) {
  if (selection.mediaKind === 'image') {
    const src = bucketCdnUrl(selection.objectKey)
    return (
      <Image
        src={src}
        alt={alt || 'Selected media'}
        width={64}
        height={64}
        unoptimized={shouldBypassVercelImageOptimization(src)}
        className='size-16 shrink-0 rounded object-cover'
      />
    )
  }

  return (
    <BucketVideoPreview
      src={bucketCdnUrl(selection.objectKey)}
      label={alt || 'Selected media'}
      className='size-16 shrink-0 rounded'
      fallbackClassName='bg-muted size-16 shrink-0 rounded'
      iconClassName='text-muted-foreground size-8'
    />
  )
}
