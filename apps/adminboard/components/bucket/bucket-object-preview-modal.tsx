'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { BucketObjectPreviewContent } from './bucket-object-preview-content'

export function BucketObjectPreviewModal({ objectKey }: { objectKey: string }) {
  const router = useRouter()

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          router.back()
        }
      }}
    >
      <DialogContent className='flex h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden border-none bg-zinc-950 p-0 sm:max-w-6xl'>
        <BucketObjectPreviewContent objectKey={objectKey} />
      </DialogContent>
    </Dialog>
  )
}
