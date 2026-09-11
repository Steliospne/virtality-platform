'use client'

import { Button } from '@/components/ui/button'
import { formatBucketUploadFileCount } from '@/lib/bucket-upload-display'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { Spinner } from '@virtality/ui/components/spinner'
import { Upload } from 'lucide-react'

type ExerciseWizardMediaUploadTabProps = {
  slot: 'image' | 'video'
  targetPrefix: string
  selectedFile: File | null
  isPending: boolean
  onTargetPrefixChange: (value: string) => void
  onSelectedFileChange: (file: File | null) => void
  onUpload: () => void
}

export function ExerciseWizardMediaUploadTab({
  slot,
  targetPrefix,
  selectedFile,
  isPending,
  onTargetPrefixChange,
  onSelectedFileChange,
  onUpload,
}: ExerciseWizardMediaUploadTabProps) {
  const accept = slot === 'image' ? 'image/*' : 'video/mp4,video/*'

  return (
    <div className='space-y-3'>
      <div className='flex flex-col gap-2'>
        <Label htmlFor={`${slot}-upload-prefix`}>Target folder</Label>
        <Input
          id={`${slot}-upload-prefix`}
          value={targetPrefix}
          onChange={(event) => onTargetPrefixChange(event.target.value)}
        />
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor={`${slot}-upload-file`}>File</Label>
        <Input
          id={`${slot}-upload-file`}
          type='file'
          accept={accept}
          className='file:text-foreground text-transparent'
          onChange={(event) =>
            onSelectedFileChange(event.target.files?.[0] ?? null)
          }
        />
        {selectedFile ? (
          <p className='text-muted-foreground text-xs'>
            {formatBucketUploadFileCount(1)}: {selectedFile.name}
          </p>
        ) : null}
      </div>
      <Button type='button' disabled={isPending} onClick={onUpload}>
        {isPending ? (
          <Spinner className='mr-2 size-4' />
        ) : (
          <Upload className='mr-2 size-4' />
        )}
        Upload
      </Button>
    </div>
  )
}
