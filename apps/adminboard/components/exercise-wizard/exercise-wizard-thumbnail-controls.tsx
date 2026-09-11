'use client'

import { ExerciseWizardThumbnailOrientation } from '@/components/exercise-wizard/exercise-wizard-thumbnail-orientation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EXERCISE_THUMBNAIL_FORMATS,
  EXERCISE_THUMBNAIL_MAX_DIMENSION,
  exerciseThumbnailOrientationFor,
  isExerciseThumbnailFormat,
  type ExerciseThumbnailFormState,
  type ExerciseThumbnailOrientation,
} from '@/lib/exercise-wizard-thumbnail'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'

type ExerciseWizardThumbnailControlsProps = {
  form: ExerciseThumbnailFormState
  disabled: boolean
  onChange: <K extends keyof ExerciseThumbnailFormState>(
    field: K,
    value: ExerciseThumbnailFormState[K],
  ) => void
  onOrientation: (orientation: ExerciseThumbnailOrientation) => void
}

export function ExerciseWizardThumbnailControls({
  form,
  disabled,
  onChange,
  onOrientation,
}: ExerciseWizardThumbnailControlsProps) {
  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      <div className='sm:col-span-2'>
        <ExerciseWizardThumbnailOrientation
          active={exerciseThumbnailOrientationFor(form)}
          disabled={disabled}
          onSelect={onOrientation}
        />
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='thumbnail-timestamp'>Timestamp (seconds)</Label>
        <Input
          id='thumbnail-timestamp'
          type='number'
          min={0}
          step='0.1'
          disabled={disabled}
          value={form.timestampSec}
          onChange={(event) => onChange('timestampSec', event.target.value)}
        />
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='thumbnail-width'>Width</Label>
          <Input
            id='thumbnail-width'
            type='number'
            min={1}
            max={EXERCISE_THUMBNAIL_MAX_DIMENSION}
            disabled={disabled}
            value={form.width}
            onChange={(event) => onChange('width', event.target.value)}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='thumbnail-height'>Height</Label>
          <Input
            id='thumbnail-height'
            type='number'
            min={1}
            max={EXERCISE_THUMBNAIL_MAX_DIMENSION}
            disabled={disabled}
            value={form.height}
            onChange={(event) => onChange('height', event.target.value)}
          />
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='thumbnail-format'>Output format</Label>
        <Select
          value={form.format}
          disabled={disabled}
          onValueChange={(value) => {
            if (isExerciseThumbnailFormat(value)) {
              onChange('format', value)
            }
          }}
        >
          <SelectTrigger id='thumbnail-format'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXERCISE_THUMBNAIL_FORMATS.map((format) => (
              <SelectItem key={format} value={format}>
                {format.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='thumbnail-quality'>Quality (JPG/WEBP only)</Label>
        <Input
          id='thumbnail-quality'
          type='number'
          min={1}
          max={100}
          disabled={disabled || form.format === 'png'}
          value={form.quality}
          onChange={(event) => onChange('quality', event.target.value)}
        />
      </div>
    </div>
  )
}
