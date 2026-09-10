'use client'

import { Button } from '@/components/ui/button'
import { EXERCISE_WIZARD_LATERALITY_OPTIONS } from '@/lib/exercise-wizard-constants'
import { cn } from '@/lib/utils'
import type { ExerciseDraftLaterality } from '@virtality/shared/types'
import {
  deriveExerciseNamesFromDraft,
  getEffectiveUnityStem,
} from '@virtality/shared/utils'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { Textarea } from '@virtality/ui/components/textarea'

export type ExerciseWizardIdentityValues = {
  laterality: ExerciseDraftLaterality | null
  displayName: string
  unityStem: string
  unityStemDirty: boolean
  description: string
}

type ExerciseWizardIdentityStepProps = {
  values: ExerciseWizardIdentityValues
  occupancyError: string | null
  onChange: (patch: Partial<ExerciseWizardIdentityValues>) => void
  onResetStem: () => void
}

export function ExerciseWizardIdentityStep({
  values,
  occupancyError,
  onChange,
  onResetStem,
}: ExerciseWizardIdentityStepProps) {
  const previewNames = deriveExerciseNamesFromDraft(values).map(
    (entry) => entry.name,
  )
  const effectiveStem = getEffectiveUnityStem(values)

  return (
    <div className='flex max-w-2xl flex-col gap-6'>
      <div className='flex flex-col gap-3'>
        <p className='text-sm font-medium'>Laterality</p>
        <div className='grid gap-3 sm:grid-cols-2'>
          {EXERCISE_WIZARD_LATERALITY_OPTIONS.map((option) => {
            const selected = values.laterality === option.value
            return (
              <button
                key={option.value}
                type='button'
                onClick={() => onChange({ laterality: option.value })}
                className={cn(
                  'rounded-lg border p-4 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent',
                )}
              >
                <p className='font-medium'>{option.label}</p>
                <p className='text-muted-foreground mt-1 text-sm'>
                  {option.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='exercise-display-name'>Display name</Label>
        <Input
          id='exercise-display-name'
          value={values.displayName}
          onChange={(event) => onChange({ displayName: event.target.value })}
          placeholder='Family name shown in Console'
        />
        <p className='text-muted-foreground text-xs'>
          Never suffix display name with _L or _R.
        </p>
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='exercise-unity-stem'>Unity stem</Label>
        <Input
          id='exercise-unity-stem'
          value={values.unityStemDirty ? values.unityStem : effectiveStem}
          onChange={(event) =>
            onChange({
              unityStem: event.target.value,
              unityStemDirty: true,
            })
          }
        />
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={onResetStem}
          >
            Reset from display name
          </Button>
          {previewNames.length > 0 ? (
            <p className='text-muted-foreground text-sm'>
              Unity key preview: {previewNames.join(', ')}
            </p>
          ) : null}
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='exercise-description'>Description</Label>
        <Textarea
          id='exercise-description'
          value={values.description}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={4}
        />
      </div>

      {occupancyError ? (
        <p className='text-destructive text-sm' role='alert'>
          {occupancyError}
        </p>
      ) : null}
    </div>
  )
}
