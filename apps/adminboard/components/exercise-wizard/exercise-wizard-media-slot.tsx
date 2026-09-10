'use client'

import { BucketObjectPickerDialog } from '@/components/email/bucket-object-picker-dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { objectKeyFromCdnUrl } from '@/lib/cdn-url-object-key'
import { formatBucketUploadFileCount } from '@/lib/bucket-upload-display'
import { getErrorMessage } from '@/lib/get-error-message'
import {
  EXERCISE_WIZARD_IMAGE_UPLOAD_PREFIX,
  EXERCISE_WIZARD_VIDEO_UPLOAD_PREFIX,
  renameFileForExerciseDraftUpload,
} from '@/lib/exercise-wizard-media'
import { useUploadBucketObjects } from '@virtality/react-query'
import { bucketCdnUrl } from '@virtality/shared/utils'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { Spinner } from '@virtality/ui/components/spinner'
import { ImageIcon, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type ExerciseWizardMediaSlotProps = {
  label: string
  slot: 'image' | 'video'
  displayName: string
  cdnUrl: string | null
  onCdnUrlChange: (cdnUrl: string | null) => void
}

type SourceMode = 'upload' | 'pick'

function isSourceMode(value: string): value is SourceMode {
  return value === 'upload' || value === 'pick'
}

export function ExerciseWizardMediaSlot({
  label,
  slot,
  displayName,
  cdnUrl,
  onCdnUrlChange,
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
  const accept = slot === 'image' ? 'image/*' : 'video/mp4,video/*'

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
      setSelectedFile(null)
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
                setSelectedFile(null)
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
              className='h-24 w-auto max-w-full rounded object-cover'
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
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='upload'>Upload</TabsTrigger>
            <TabsTrigger value='pick'>Pick from bucket</TabsTrigger>
          </TabsList>
          <TabsContent value='upload' className='space-y-3 pt-2'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor={`${slot}-upload-prefix`}>Target folder</Label>
              <Input
                id={`${slot}-upload-prefix`}
                value={targetPrefix}
                onChange={(event) => setTargetPrefix(event.target.value)}
              />
            </div>
            <div className='flex flex-col gap-2'>
              <Label htmlFor={`${slot}-upload-file`}>File</Label>
              <Input
                id={`${slot}-upload-file`}
                type='file'
                accept={accept}
                className='file:text-foreground text-transparent'
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null)
                  uploadMutation.reset()
                }}
              />
              {selectedFile ? (
                <p className='text-muted-foreground text-xs'>
                  {formatBucketUploadFileCount(1)}: {selectedFile.name}
                </p>
              ) : null}
            </div>
            <Button
              type='button'
              disabled={uploadMutation.isPending}
              onClick={() => void handleUpload()}
            >
              {uploadMutation.isPending ? (
                <Spinner className='mr-2 size-4' />
              ) : (
                <Upload className='mr-2 size-4' />
              )}
              Upload
            </Button>
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
