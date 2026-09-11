'use client'

import { Button } from '@/components/ui/button'
import { ExerciseWizardExerciseIdField } from '@/components/exercise-wizard/exercise-wizard-exercise-id-field'
import { ExerciseWizardFieldError } from '@/components/exercise-wizard/exercise-wizard-field-error'
import type { ExerciseWizardIdentityErrors } from '@/lib/exercise-wizard-validation'
import { EXERCISE_WIZARD_LATERALITY_OPTIONS } from '@/lib/exercise-wizard-constants'
import { cn } from '@/lib/utils'
import type { ExerciseDraftLaterality } from '@virtality/shared/types'
import {
  deriveExerciseIdsFromDraft,
  deriveExerciseNamesFromDraft,
  getEffectiveUnityStem,
} from '@virtality/shared/utils'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { Textarea } from '@virtality/ui/components/textarea'

export type ExerciseWizardIdentityValues = {
  laterality: ExerciseDraftLaterality | null
  exerciseId: string
  displayName: string
  unityStem: string
  unityStemDirty: boolean
  description: string
}

type ExerciseWizardIdentityStepProps = {
  values: ExerciseWizardIdentityValues
  errors: ExerciseWizardIdentityErrors
  occupancyError: string | null
  onChange: (patch: Partial<ExerciseWizardIdentityValues>) => void
  onResetStem: () => void
}

export function ExerciseWizardIdentityStep({
  values,
  errors,
  occupancyError,
  onChange,
  onResetStem,
}: ExerciseWizardIdentityStepProps) {
  const previewNames = deriveExerciseNamesFromDraft(values).map(
    (entry) => entry.name,
  )
  const effectiveStem = getEffectiveUnityStem(values)
  const previewExerciseIds = deriveExerciseIdsFromDraft(values)

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
        <ExerciseWizardFieldError message={errors.laterality} />
      </div>

      <ExerciseWizardExerciseIdField
        value={values.exerciseId}
        error={errors.exerciseId}
        previewIds={previewExerciseIds}
        onChange={(exerciseId) => onChange({ exerciseId })}
      />

      <div className='flex flex-col gap-2'>
        <Label htmlFor='exercise-display-name'>Display name</Label>
        <Input
          id='exercise-display-name'
          value={values.displayName}
          onChange={(event) => onChange({ displayName: event.target.value })}
          placeholder='Family name shown in Console'
          aria-invalid={errors.displayName ? true : undefined}
        />
        <ExerciseWizardFieldError
          message={errors.displayName}
          hint='Never suffix display name with _L or _R.'
        />
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
          aria-invalid={errors.unityStem ? true : undefined}
        />
        <ExerciseWizardFieldError message={errors.unityStem} />
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
          aria-invalid={errors.description ? true : undefined}
        />
        <ExerciseWizardFieldError message={errors.description} />
      </div>

      {occupancyError ? (
        <p className='text-destructive text-sm' role='alert'>
          {occupancyError}
        </p>
      ) : null}
    </div>
  )
}
