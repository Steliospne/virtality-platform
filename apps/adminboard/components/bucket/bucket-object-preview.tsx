'use client'

import {
  type BucketObjectRow,
  shouldBypassVercelImageOptimization,
} from '@virtality/shared/utils'
import { FileIcon } from 'lucide-react'
import { BucketVideoPreview } from './bucket-video-preview'
import Image from 'next/image'

function isImageContentType(contentType: string): boolean {
  return contentType.startsWith('image/')
}

function isVideoContentType(contentType: string): boolean {
  return contentType.startsWith('video/')
}

export function ObjectPreview({ object }: { object: BucketObjectRow }) {
  if (isImageContentType(object.contentType)) {
    return (
      <Image
        src={object.cdnUrl}
        alt={object.name}
        width={48}
        height={48}
        unoptimized={shouldBypassVercelImageOptimization(object.cdnUrl)}
        className='size-12 rounded-md border border-zinc-600 object-contain'
      />
    )
  }

  if (isVideoContentType(object.contentType)) {
    return <BucketVideoPreview src={object.cdnUrl} label={object.name} />
  }

  return <FileIcon className='size-12 text-zinc-400' aria-hidden='true' />
}
