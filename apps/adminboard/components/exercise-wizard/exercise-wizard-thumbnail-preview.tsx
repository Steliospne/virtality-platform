'use client'

type ExerciseWizardThumbnailPreviewProps = {
  previewUrl: string | null
}

export function ExerciseWizardThumbnailPreview({
  previewUrl,
}: ExerciseWizardThumbnailPreviewProps) {
  return (
    <div className='rounded-md border p-3'>
      <p className='text-muted-foreground mb-2 text-xs'>Preview</p>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt='Generated thumbnail preview'
          className='max-h-60 w-full rounded object-contain'
        />
      ) : (
        <p className='text-muted-foreground text-sm'>
          No thumbnail generated yet.
        </p>
      )}
    </div>
  )
}
