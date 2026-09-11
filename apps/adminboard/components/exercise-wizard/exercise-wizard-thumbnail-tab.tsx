'use client'

import { ExerciseWizardThumbnailControls } from '@/components/exercise-wizard/exercise-wizard-thumbnail-controls'
import { ExerciseWizardThumbnailPreview } from '@/components/exercise-wizard/exercise-wizard-thumbnail-preview'
import { useExerciseThumbnailGenerator } from '@/components/exercise-wizard/use-exercise-thumbnail-generator'
import { Button } from '@/components/ui/button'
import {
  EXERCISE_WIZARD_IMAGE_UPLOAD_PREFIX,
  renameFileForExerciseDraftUpload,
} from '@/lib/exercise-wizard-media'
import {
  exerciseThumbnailFile,
  type ExerciseThumbnailVideoSource,
} from '@/lib/exercise-wizard-thumbnail'
import { getErrorMessage } from '@/lib/get-error-message'
import { useUploadBucketObjects } from '@virtality/react-query'
import { Spinner } from '@virtality/ui/components/spinner'
import { Camera, Check } from 'lucide-react'
import { toast } from 'sonner'

type ExerciseWizardThumbnailTabProps = {
  source: ExerciseThumbnailVideoSource | null
  displayName: string
  onCdnUrlChange: (cdnUrl: string) => void
}

export function ExerciseWizardThumbnailTab({
  source,
  displayName,
  onCdnUrlChange,
}: ExerciseWizardThumbnailTabProps) {
  const generator = useExerciseThumbnailGenerator(source)
  const uploadMutation = useUploadBucketObjects()
  const isBusy = generator.isBusy || uploadMutation.isPending

  const handleConfirm = async () => {
    if (!generator.generated) {
      toast.error('Generate a thumbnail first.')
      return
    }

    if (!displayName.trim()) {
      toast.error('Enter a display name on Identity before uploading media.')
      return
    }

    try {
      const file = renameFileForExerciseDraftUpload(
        exerciseThumbnailFile(generator.generated.blob, generator.form.format),
        displayName,
      )
      const outcome = await uploadMutation.mutateAsync({
        targetPrefix: EXERCISE_WIZARD_IMAGE_UPLOAD_PREFIX,
        files: [file],
      })

      const upload = outcome.uploads[0]
      if (!upload) {
        const failure = outcome.failures[0]
        toast.error(failure?.error ?? 'Upload failed.')
        return
      }

      onCdnUrlChange(upload.cdnUrl)
      generator.clear()
      toast.success('Thumbnail uploaded.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Upload failed.'))
    }
  }

  if (!source) {
    return (
      <p className='text-muted-foreground text-sm'>
        Pick or select a video first.
      </p>
    )
  }

  return (
    <div className='space-y-3'>
      <ExerciseWizardThumbnailControls
        form={generator.form}
        disabled={isBusy}
        onChange={generator.updateField}
        onOrientation={generator.applyOrientation}
      />
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          disabled={isBusy}
          onClick={() => void generator.generate()}
        >
          {generator.isBusy ? (
            <Spinner className='mr-2 size-4' />
          ) : (
            <Camera className='mr-2 size-4' />
          )}
          Generate thumbnail
        </Button>
        <Button
          type='button'
          disabled={isBusy || !generator.generated}
          onClick={() => void handleConfirm()}
        >
          {uploadMutation.isPending ? (
            <Spinner className='mr-2 size-4' />
          ) : (
            <Check className='mr-2 size-4' />
          )}
          Use as thumbnail
        </Button>
        <span className='text-muted-foreground text-xs'>
          {generator.status}
        </span>
      </div>
      {generator.error ? (
        <p className='text-destructive text-sm'>{generator.error}</p>
      ) : null}
      <ExerciseWizardThumbnailPreview
        previewUrl={generator.generated?.previewUrl ?? null}
      />
    </div>
  )
}
