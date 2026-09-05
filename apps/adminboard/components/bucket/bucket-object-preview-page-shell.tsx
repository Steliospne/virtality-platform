import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BucketObjectPreviewContent } from './bucket-object-preview-content'

export function BucketObjectPreviewPageShell({
  objectKey,
}: {
  objectKey: string
}) {
  return (
    <div className='flex min-h-svh flex-col bg-zinc-950 text-white'>
      <div className='flex items-center gap-2 border-b border-white/10 p-4'>
        <Link
          href='/bucket'
          className='flex items-center gap-1 text-sm text-white/80 hover:text-white'
        >
          <ArrowLeft className='size-4' aria-hidden='true' />
          Back to bucket
        </Link>
      </div>
      <div className='flex min-h-0 flex-1 flex-col'>
        <BucketObjectPreviewContent objectKey={objectKey} />
      </div>
    </div>
  )
}
