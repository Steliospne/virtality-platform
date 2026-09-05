import Link from 'next/link'

export function BucketObjectPreviewMissing({
  objectKey,
}: {
  objectKey: string
}) {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center text-white'>
      <p className='text-sm text-white/70'>
        This file no longer exists. It may have been deleted, moved, or renamed.
      </p>
      <p className='font-mono text-xs break-all text-white/40'>{objectKey}</p>
      <Link href='/bucket' className='text-sm underline underline-offset-4'>
        Back to bucket
      </Link>
    </div>
  )
}
