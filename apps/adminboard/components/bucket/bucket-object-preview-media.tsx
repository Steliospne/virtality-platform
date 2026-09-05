import { shouldBypassVercelImageOptimization } from '@virtality/shared/utils'
import { FileIcon } from 'lucide-react'
import Image from 'next/image'
import { isImageContentType, isVideoContentType } from './bucket-content-type'

type BucketObjectPreviewMediaProps = {
  cdnUrl: string
  contentType: string
  name: string
}

export function BucketObjectPreviewMedia({
  cdnUrl,
  contentType,
  name,
}: BucketObjectPreviewMediaProps) {
  if (isImageContentType(contentType)) {
    return (
      <div className='relative min-h-0 flex-1 bg-black'>
        <Image
          src={cdnUrl}
          alt={name}
          fill
          unoptimized={shouldBypassVercelImageOptimization(cdnUrl)}
          className='object-contain'
          sizes='100vw'
        />
      </div>
    )
  }

  if (isVideoContentType(contentType)) {
    return (
      <div className='flex min-h-0 flex-1 items-center justify-center bg-black p-4'>
        <video
          src={cdnUrl}
          controls
          className='max-h-full max-w-full object-contain'
        />
      </div>
    )
  }

  return (
    <div className='flex min-h-0 flex-1 items-center justify-center bg-black p-4'>
      <FileIcon className='size-16 text-white/40' aria-hidden='true' />
    </div>
  )
}
