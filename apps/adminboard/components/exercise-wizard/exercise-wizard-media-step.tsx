'use client'

import { ExerciseWizardMediaSlot } from '@/components/exercise-wizard/exercise-wizard-media-slot'

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
  return (
    <div className='flex max-w-2xl flex-col gap-6'>
      <p className='text-muted-foreground text-sm'>
        One image and one video are shared across the whole exercise family.
        Upload uses a key stem from the display name, not the Unity stem.
      </p>
      <ExerciseWizardMediaSlot
        label='Image'
        slot='image'
        displayName={displayName}
        cdnUrl={image}
        onCdnUrlChange={(cdnUrl) => onChange({ image: cdnUrl })}
      />
      <ExerciseWizardMediaSlot
        label='Video'
        slot='video'
        displayName={displayName}
        cdnUrl={video}
        onCdnUrlChange={(cdnUrl) => onChange({ video: cdnUrl })}
      />
    </div>
  )
}
