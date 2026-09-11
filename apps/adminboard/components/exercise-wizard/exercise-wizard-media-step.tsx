'use client'

import { ExerciseWizardMediaSlot } from '@/components/exercise-wizard/exercise-wizard-media-slot'
import type { ExerciseThumbnailVideoSource } from '@/lib/exercise-wizard-thumbnail'
import { useState } from 'react'

type ExerciseWizardMediaStepProps = {
  displayName: string
  image: string | null
  video: string | null
  onChange: (patch: { image?: string | null; video?: string | null }) => void
}

export function ExerciseWizardMediaStep({
  displayName,
  image,
  video,
  onChange,
}: ExerciseWizardMediaStepProps) {
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null)

  const thumbnailSource: ExerciseThumbnailVideoSource | null = video
    ? { kind: 'cdn', url: video }
    : pendingVideoFile
      ? { kind: 'file', file: pendingVideoFile }
      : null

  return (
    <div className='flex max-w-2xl flex-col gap-6'>
      <p className='text-muted-foreground text-sm'>
        One image and one video are shared across the whole exercise family.
        Upload uses a key stem from the display name, not the Unity stem.
      </p>
      <ExerciseWizardMediaSlot
        label='Video'
        slot='video'
        displayName={displayName}
        cdnUrl={video}
        onCdnUrlChange={(cdnUrl) => onChange({ video: cdnUrl })}
        onPendingFileChange={setPendingVideoFile}
      />
      <ExerciseWizardMediaSlot
        label='Image'
        slot='image'
        displayName={displayName}
        cdnUrl={image}
        thumbnailSource={thumbnailSource}
        onCdnUrlChange={(cdnUrl) => onChange({ image: cdnUrl })}
      />
    </div>
  )
}
