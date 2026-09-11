'use client'

import { BucketObjectPickerDialog } from '@/components/email/bucket-object-picker-dialog'
import { ExerciseWizardMediaUploadTab } from '@/components/exercise-wizard/exercise-wizard-media-upload-tab'
import { ExerciseWizardThumbnailTab } from '@/components/exercise-wizard/exercise-wizard-thumbnail-tab'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { objectKeyFromCdnUrl } from '@/lib/cdn-url-object-key'
import { getErrorMessage } from '@/lib/get-error-message'
import {
  EXERCISE_WIZARD_IMAGE_UPLOAD_PREFIX,
  EXERCISE_WIZARD_VIDEO_UPLOAD_PREFIX,
  renameFileForExerciseDraftUpload,
} from '@/lib/exercise-wizard-media'
import type { ExerciseThumbnailVideoSource } from '@/lib/exercise-wizard-thumbnail'
import { cn } from '@/lib/utils'
import { useUploadBucketObjects } from '@virtality/react-query'
import { bucketCdnUrl } from '@virtality/shared/utils'
import { ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type ExerciseWizardMediaSlotProps = {
  label: string
  slot: 'image' | 'video'
  displayName: string
  cdnUrl: string | null
  onCdnUrlChange: (cdnUrl: string | null) => void
  /** Image slot only: the video the Exercise Thumbnail Generator reads from. */
  thumbnailSource?: ExerciseThumbnailVideoSource | null
  /** Video slot only: reports the file selected for upload before it is uploaded. */
  onPendingFileChange?: (file: File | null) => void
}

type SourceMode = 'upload' | 'pick' | 'thumbnail'

function isSourceMode(value: string): value is SourceMode {
  return value === 'upload' || value === 'pick' || value === 'thumbnail'
}

export function ExerciseWizardMediaSlot({
  label,
  slot,
  displayName,
  cdnUrl,
  onCdnUrlChange,
  thumbnailSource = null,
  onPendingFileChange,
}: ExerciseWizardMediaSlotProps) {
  const [sourceMode, setSourceMode] = useState<SourceMode>('upload')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [targetPrefix, setTargetPrefix] = useState(
    slot === 'image'
      ? EXERCISE_WIZARD_IMAGE_UPLOAD_PREFIX
      : EXERCISE_WIZARD_VIDEO_UPLOAD_PREFIX,
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isReplacing, setIsReplacing] = useState(false)
  const uploadMutation = useUploadBucketObjects()

  const objectKey = cdnUrl ? objectKeyFromCdnUrl(cdnUrl) : null
  const pickerKind = slot === 'image' ? 'image' : 'mp4'
  const showThumbnailTab = slot === 'image'

  const selectFile = (file: File | null) => {
    setSelectedFile(file)
    onPendingFileChange?.(file)
    uploadMutation.reset()
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Select a file to upload.')
      return
    }

    if (!displayName.trim()) {
      toast.error('Enter a display name on Identity before uploading media.')
      return
    }

    try {
      const file = renameFileForExerciseDraftUpload(selectedFile, displayName)
      const outcome = await uploadMutation.mutateAsync({
        targetPrefix,
        files: [file],
      })

      const upload = outcome.uploads[0]
      if (!upload) {
        const failure = outcome.failures[0]
        toast.error(failure?.error ?? 'Upload failed.')
        return
      }

      onCdnUrlChange(upload.cdnUrl)
      selectFile(null)
      setIsReplacing(false)
      toast.success(`${label} uploaded.`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Upload failed.'))
    }
  }

  const handlePick = (pickedObjectKey: string) => {
    onCdnUrlChange(bucketCdnUrl(pickedObjectKey))
    setPickerOpen(false)
    toast.success(`${label} selected from bucket.`)
  }

  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <p className='font-medium'>{label}</p>
        {cdnUrl && !isReplacing ? (
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => {
                selectFile(null)
                setSourceMode('upload')
                setIsReplacing(true)
              }}
            >
              Replace
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => onCdnUrlChange(null)}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </div>

      {cdnUrl && !isReplacing ? (
        <div className='flex flex-col gap-2'>
          {slot === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cdnUrl}
              alt={`${label} preview`}
              className='max-h-60 w-auto max-w-full rounded object-contain'
            />
          ) : (
            <video
              src={cdnUrl}
              controls
              className='max-h-40 w-full rounded bg-black'
            />
          )}
          {objectKey ? (
            <p className='font-mono text-xs break-all text-zinc-500'>
              {objectKey}
            </p>
          ) : null}
        </div>
      ) : (
        <Tabs
          value={sourceMode}
          onValueChange={(value) => {
            if (isSourceMode(value)) {
              setSourceMode(value)
            }
          }}
        >
          <TabsList
            className={cn(
              'grid w-full',
              showThumbnailTab ? 'grid-cols-3' : 'grid-cols-2',
            )}
          >
            <TabsTrigger value='upload'>Upload</TabsTrigger>
            <TabsTrigger value='pick'>Pick from bucket</TabsTrigger>
            {showThumbnailTab ? (
              <TabsTrigger value='thumbnail' disabled={!thumbnailSource}>
                From video
              </TabsTrigger>
            ) : null}
          </TabsList>
          <TabsContent value='upload' className='pt-2'>
            <ExerciseWizardMediaUploadTab
              slot={slot}
              targetPrefix={targetPrefix}
              selectedFile={selectedFile}
              isPending={uploadMutation.isPending}
              onTargetPrefixChange={setTargetPrefix}
              onSelectedFileChange={selectFile}
              onUpload={() => void handleUpload()}
            />
          </TabsContent>
          <TabsContent value='pick' className='pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setPickerOpen(true)}
            >
              <ImageIcon className='mr-2 size-4' />
              Choose from bucket
            </Button>
          </TabsContent>
          {showThumbnailTab ? (
            <TabsContent value='thumbnail' className='pt-2'>
              <ExerciseWizardThumbnailTab
                source={thumbnailSource}
                displayName={displayName}
                onCdnUrlChange={(nextCdnUrl) => {
                  onCdnUrlChange(nextCdnUrl)
                  setIsReplacing(false)
                }}
              />
            </TabsContent>
          ) : null}
        </Tabs>
      )}

      <BucketObjectPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        objectKind={pickerKind}
        onSelect={handlePick}
      />
    </div>
  )
}
