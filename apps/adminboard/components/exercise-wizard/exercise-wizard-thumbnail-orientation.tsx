'use client'

import { Button } from '@/components/ui/button'
import {
  EXERCISE_THUMBNAIL_ORIENTATIONS,
  EXERCISE_THUMBNAIL_ORIENTATION_PRESETS,
  type ExerciseThumbnailOrientation,
} from '@/lib/exercise-wizard-thumbnail'
import { RectangleHorizontal, RectangleVertical } from 'lucide-react'

type ExerciseWizardThumbnailOrientationProps = {
  active: ExerciseThumbnailOrientation | null
  disabled: boolean
  onSelect: (orientation: ExerciseThumbnailOrientation) => void
}

const ORIENTATION_ICONS = {
  landscape: RectangleHorizontal,
  portrait: RectangleVertical,
} as const

export function ExerciseWizardThumbnailOrientation({
  active,
  disabled,
  onSelect,
}: ExerciseWizardThumbnailOrientationProps) {
  return (
    <div className='flex flex-wrap gap-2'>
      {EXERCISE_THUMBNAIL_ORIENTATIONS.map((orientation) => {
        const Icon = ORIENTATION_ICONS[orientation]
        const preset = EXERCISE_THUMBNAIL_ORIENTATION_PRESETS[orientation]
        return (
          <Button
            key={orientation}
            type='button'
            size='sm'
            variant={active === orientation ? 'default' : 'outline'}
            disabled={disabled}
            aria-pressed={active === orientation}
            onClick={() => onSelect(orientation)}
          >
            <Icon className='mr-2 size-4' />
            {orientation === 'landscape' ? 'Landscape' : 'Portrait'}{' '}
            {preset.width}×{preset.height}
          </Button>
        )
      })}
    </div>
  )
}
